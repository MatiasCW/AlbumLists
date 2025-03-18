import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

// Function to fetch the top 100 albums based on precomputed average scores
export const getTop100Albums = async () => {
  try {
    console.log("Fetching top 100 albums from the global albums collection...");

    // Query the albums collection, ordered by averageScore in descending order, and limit to 100
    const albumsRef = collection(db, "albums");
    const q = query(albumsRef, orderBy("averageScore", "desc"), limit(100));
    const albumsSnapshot = await getDocs(q);

    console.log(`Total albums fetched: ${albumsSnapshot.size}`); // Debugging log

    // Array to store album data with average scores, names, and image URLs
    const albumData = [];

    // Iterate through each album in the query result
    albumsSnapshot.forEach((albumDoc) => {
      const albumId = albumDoc.id;
      const albumName = albumDoc.data().name; // Fetch the album name
      const albumImageUrl = albumDoc.data().image; // Fetch the album cover image URL
      const averageScore = albumDoc.data().averageScore; // Fetch the precomputed average score

      console.log(`Processing album with ID: ${albumId}`); // Debugging log

      // Add the album to the array with its average score, name, and image URL
      albumData.push({
        id: albumId, // Album ID
        name: albumName, // Album name
        image: albumImageUrl, // Album cover image URL
        averageScore: averageScore, // Precomputed average score
      });
    });

    console.log(`Fetched ${albumData.length} albums.`);

    // Return the top 100 albums (already sorted by Firestore query)
    return albumData;
  } catch (error) {
    console.error("Error fetching top albums:", error);
    return [];
  }
};

export { auth, db };