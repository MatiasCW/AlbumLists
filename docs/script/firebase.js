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

// Function to get the combined score (sum of ratings) for a specific album
export const getAlbumCombinedScore = async (albumID) => {
    try {
        const ratingsRef = collection(db, "ratings", albumID, "users");  // Ref to ratings collection for the album
        const ratingsSnapshot = await getDocs(ratingsRef);  // Fetch ratings

        let totalScore = 0;

        ratingsSnapshot.forEach((doc) => {
            totalScore += doc.data().rating;  // Sum all ratings for the album
        });

        return totalScore;  // Return the combined score
    } catch (error) {
        console.error("Error fetching ratings: ", error);
        return 0;  // Return 0 if there’s an error
    }
};

// Function to get the top 100 albums sorted by combined score (sum of ratings)
export const getTop100Albums = async (userId) => {  // Add userId to the function
    try {
        // Log the userId and the Firestore path
        console.log("Fetching albums for userId:", userId);
        const albumsRef = collection(db, "users", userId, "albums");  // Reference to the user's albums subcollection
        console.log("Firestore Path:", albumsRef.path);

        // Fetch albums from the specific user's sub-collection
        const albumsSnapshot = await getDocs(albumsRef);
        let albumData = [];

        for (const albumDoc of albumsSnapshot.docs) {
            const albumID = albumDoc.id;
            const album = { id: albumID, ...albumDoc.data() };  // Get album data

            // Assuming getAlbumCombinedScore fetches the combined score based on ratings
            const combinedScore = await getAlbumCombinedScore(albumID);

            album.combinedScore = combinedScore;
            albumData.push(album);  // Add the album to the data array
        }

        // Sort albums by combined score in descending order
        albumData.sort((a, b) => b.combinedScore - a.combinedScore);

        // Return top 100 albums based on combined score
        return albumData.slice(0, 100);  
    } catch (error) {
        console.error("Error fetching albums: ", error);
        return [];
    }
};


export { auth, db };

