import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";  

const firebaseConfig = {
    apiKey: "AIzaSyD9FcGo-KMXdK9RwT2dJIHETmclikJPRr8",
    authDomain: "thealbumlists.firebaseapp.com",
    projectId: "thealbumlists",
    storageBucket: "thealbumlists.firebasestorage.app",
    messagingSenderId: "534900243533",
    appId: "1:534900243533:web:b4220d85c1d947f4f33004",
    measurementId: "G-V5FYJL6YQM"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to get the average rating for a specific album
export const getAlbumAverageRating = async (albumID) => {
    try {
        const ratingsRef = collection(db, "ratings", albumID, "users");
        const ratingsSnapshot = await getDocs(ratingsRef);  
        
        let totalRatings = 0;
        let count = 0;

        ratingsSnapshot.forEach((doc) => {
            totalRatings += doc.data().rating;
            count++;
        });

        return count > 0 ? totalRatings / count : 0;  // Return average rating
    } catch (error) {
        console.error("Error fetching ratings: ", error);
        return 0;  // Return 0 if there’s an error
    }
};

// Function to get the top 100 albums sorted by average rating
export const getTop100Albums = async () => {
    try {
        const albumsSnapshot = await getDocs(collection(db, "albums"));
        let albumData = [];

        for (const albumDoc of albumsSnapshot.docs) {
            const albumID = albumDoc.id;
            const album = { id: albumID, ...albumDoc.data() };
            const averageRating = await getAlbumAverageRating(albumID);

            album.averageRating = averageRating;
            albumData.push(album);
        }

        albumData.sort((a, b) => b.averageRating - a.averageRating);  // Sort albums by rating

        return albumData.slice(0, 100);  // Return the top 100 albums
    } catch (error) {
        console.error("Error fetching albums: ", error);
        return [];
    }
};

export { auth, db };


