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
        console.log("Fetching albums and ratings from the global albums collection...");

        // Fetch all albums from the global albums collection
        const albumsRef = collection(db, "albums");
        const albumsSnapshot = await getDocs(albumsRef);

        // Array to store album data with average scores
        const albumData = [];

        // Iterate through each album in the global albums collection
        for (const albumDoc of albumsSnapshot.docs) {
            const albumData = albumDoc.data();
            const albumId = albumDoc.id;
            const albumName = albumData.name;

            // Fetch ratings from the global ratings subcollection for this album
            const ratingsRef = collection(db, "albums", albumId, "ratings");
            const ratingsSnapshot = await getDocs(ratingsRef);

            let totalScore = 0;
            let numberOfRatings = 0;

            // Sum all ratings and count the number of ratings
            ratingsSnapshot.forEach((ratingDoc) => {
                const ratingData = ratingDoc.data();
                console.log("Rating Document:", ratingDoc.id, "Score:", ratingData.score); // Debugging log
                if (ratingData.score !== undefined && ratingData.score !== null) {
                    totalScore += ratingData.score; // Use 'score' field
                    numberOfRatings++;
                }
            });

            // Calculate the average score (avoid division by zero)
            const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

            // Add the album to the array with its average score
            albumData.push({
                name: albumName,
                averageScore: averageScore,
            });
        }

        console.log(`Fetched ${albumData.length} albums.`);

        // Sort albums by average score (highest first)
        albumData.sort((a, b) => b.averageScore - a.averageScore);

        // Return the top 100 albums
        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums:", error);
        return [];
    }
};


export { auth, db };
