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

// Function to fetch albums from all users
export const getTop100Albums = async () => {
    try {
        console.log("Fetching albums from all users...");

        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);

        let albumData = [];

        // Iterate through all users
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const albumsRef = collection(db, `users/${userId}/albums`);
            const albumsSnapshot = await getDocs(albumsRef);

            albumsSnapshot.forEach((albumDoc) => {
                let album = {
                    id: albumDoc.id,
                    userId: userId, // Keep track of owner
                    ...albumDoc.data(),
                };
                albumData.push(album);
            });
        }

        console.log(`Fetched ${albumData.length} albums.`);

        // Sort albums by score in descending order
        albumData.sort((a, b) => (b.score || 0) - (a.score || 0));

        return albumData.slice(0, 100);
    } catch (error) {
        console.error("Error fetching albums:", error);
        return [];
    }
};

export { auth, db };
