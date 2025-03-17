import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Firebase initialization
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

// Global variable to track authentication state
let userId = null;
onAuthStateChanged(auth, (user) => {
    userId = user ? user.uid : null;
    console.log(user ? `User logged in: ${userId}` : "User logged out.");
});

// Function to fetch albums from all users and calculate combined scores
export const getTop100Albums = async () => {
    try {
        console.log("Fetching albums from all users...");

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        // Object to store combined scores for each album
        const albumScores = {};

        // Iterate through all users
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const albumsRef = collection(db, `users/${userId}/albums`);
            const albumsSnapshot = await getDocs(albumsRef);

            // Iterate through the user's albums
            for (const albumDoc of albumsSnapshot.docs) {
                const albumData = albumDoc.data();
                const albumName = albumData.name; // Use album name as the key

                // Initialize score if it doesn't exist
                if (!albumScores[albumName]) {
                    albumScores[albumName] = 0;
                }

                // ✅ Add the album's score (if it exists)
                const albumScore = albumData.score || 0;
                albumScores[albumName] += albumScore;
            }
        }

        // Convert to an array of { name, combinedScore }
        const albumData = Object.keys(albumScores).map((albumName) => ({
            name: albumName,
            combinedScore: albumScores[albumName],
        }));

        console.log(`Fetched ${albumData.length} albums.`);

        // Sort albums by combined score (highest first)
        albumData.sort((a, b) => b.combinedScore - a.combinedScore);

        // Return the top 100 albums
        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums:", error);
        return [];
    }
};

export { auth, db };
