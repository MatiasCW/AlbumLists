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
            albumsSnapshot.forEach((albumDoc) => {
                const albumData = albumDoc.data();
                const albumName = albumData.name; // Use album name as the key
                const albumScore = albumData.score || 0; // Default to 0 if score is missing

                // Add the score to the combined total for this album
                if (!albumScores[albumName]) {
                    albumScores[albumName] = 0;
                }
                albumScores[albumName] += albumScore;
            });
        }

        // Convert the albumScores object to an array of { name, combinedScore } objects
        const albumData = Object.keys(albumScores).map((albumName) => ({
            name: albumName,
            combinedScore: albumScores[albumName],
        }));

        console.log(`Fetched ${albumData.length} albums.`);

        // Sort albums by combined score in descending order
        albumData.sort((a, b) => b.combinedScore - a.combinedScore);

        // Return the top 100 albums
        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums:", error);
        return [];
    }
};

export { auth, db };