import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "", 
    authDomain: "",
    projectId: "", 
    storageBucket: "",
    messagingSenderId: "", 
    appId: "", 
    measurementId: "G-V5FYJL6YQM"
};

// Initialize Firebase
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
            totalRatings += doc.data().rating;  // Assuming each rating document has a "rating" field
            count++;
        });

        return count > 0 ? totalRatings / count : 0;  // Return average rating, 0 if no ratings
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

            // Add average rating to album object
            album.averageRating = averageRating;

            albumData.push(album);
        }

        // Sort albums by average rating in descending order
        albumData.sort((a, b) => b.averageRating - a.averageRating);

        // Return the top 100 albums
        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums: ", error);
        return [];
    }
};

export { auth, db };
