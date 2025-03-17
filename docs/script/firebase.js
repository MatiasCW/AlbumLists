import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
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

// Global variable to store the userId once authenticated
let userId = null;

// Promise to handle user authentication state
let authStatePromise = new Promise((resolve, reject) => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            userId = user.uid;  // Set userId when the user is logged in
            resolve(); // Resolve the promise once the user is logged in
        } else {
            userId = null;  // Set userId to null if user logs out
            reject("User is not logged in.");  // Reject if user logs out
        }
    });
});

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
export const getTop100Albums = async () => {
    // Wait for the user authentication state to be loaded
    try {
        await authStatePromise;  // Wait until the user is authenticated
        if (!userId) {
            throw new Error("User is not logged in.");
        }

        console.log("Fetching albums for all users");
        const albumsRef = collection(db, "albums");  // Reference to the root-level 'albums' collection
        console.log("Firestore Path:", albumsRef.path);

        const albumsSnapshot = await getDocs(albumsRef);
        let albumData = [];

        for (const albumDoc of albumsSnapshot.docs) {
            const albumID = albumDoc.id;
            const album = { id: albumID, ...albumDoc.data() };

            const combinedScore = await getAlbumCombinedScore(albumID);

            album.combinedScore = combinedScore;
            albumData.push(album);  // Add the album to the data array
        }

        albumData.sort((a, b) => b.combinedScore - a.combinedScore);

        // Return top 100 albums based on combined score
        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums: ", error);
        return [];
    }
};

export { auth, db };
