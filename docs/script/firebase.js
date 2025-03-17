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

// Global variable to store the userId once authenticated (used for managing state)
let userId = null;

// Function to handle user authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        userId = user.uid;  // Set userId when the user is logged in
        console.log("User logged in with UID:", userId);
    } else {
        userId = null;  // Set userId to null if user logs out
        console.log("User logged out.");
    }
});

// Function to get the combined score (sum of ratings) for a specific album
const getAlbumCombinedScore = async (albumID) => {
    try {
        const ratingsRef = collection(db, "ratings", albumID, "users");  // Reference to the ratings collection for the album
        const ratingsSnapshot = await getDocs(ratingsRef);  // Fetch ratings

        let totalScore = 0;

        // Sum all ratings for the album
        ratingsSnapshot.forEach((doc) => {
            totalScore += doc.data().rating;  
        });

        return totalScore;  // Return the combined score
    } catch (error) {
        console.error("Error fetching ratings: ", error);
        return 0;  // Return 0 if there’s an error
    }
};

// Function to get the top 100 albums sorted by combined score (sum of ratings)
export const getTop100Albums = async () => {
    try {
      const albumsRef = collection(db, "albums");
      const albumsSnapshot = await getDocs(albumsRef);
      let albumData = [];
  
      for (const albumDoc of albumsSnapshot.docs) {
        const albumID = albumDoc.id;
        const album = { id: albumID, ...albumDoc.data() };
  
        // Get all ratings for this album
        const ratingsRef = collection(db, "albums", albumID, "ratings");
        const ratingsSnapshot = await getDocs(ratingsRef);
        
        // Calculate combined score
        let combinedScore = 0;
        ratingsSnapshot.forEach((doc) => {
          combinedScore += doc.data().rating || 0;
        });
  
        album.combinedScore = combinedScore;
        albumData.push(album);
      }
  
      // Sort and return top 100
      albumData.sort((a, b) => b.combinedScore - a.combinedScore);
      return albumData.slice(0, 100);
    } catch (error) {
      console.error("Error fetching albums: ", error);
      return [];
    }
  };

export { auth, db };
