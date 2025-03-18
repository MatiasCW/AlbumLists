import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { 
  getFirestore, collection, query, orderBy, limit, onSnapshot, where 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBx8UEWD05g3kiPROxWegNmD67LnV1wOuA",
    authDomain: "thealbumlists.firebaseapp.com",
    projectId: "thealbumlists",
    storageBucket: "thealbumlists.firebasestorage.app",
    messagingSenderId: "534900243533",
    appId: "1:534900243533:web:9c1142a4ac0ae0d6f33004",
    measurementId: "G-FVH6R53D5R"
  };
  
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Track authentication state
let userId = null;
onAuthStateChanged(auth, (user) => {
  userId = user ? user.uid : null;
  console.log(user ? `User logged in: ${userId}` : "User logged out.");
});

// Real-time listener for top 100 albums
export const listenToTop100Albums = (callback) => {
  try {
    const albumsRef = collection(db, "albums");
    const q = query(
      albumsRef,
      where("numberOfRatings", ">", 0), // Only include albums with ratings
      orderBy("averageScore", "desc"), 
      limit(100)
    );

    // Real-time updates
    return onSnapshot(q, (snapshot) => {
      const albums = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        image: doc.data().image,
        averageScore: doc.data().averageScore?.toFixed(1) || 0
      }));
      callback(albums);
    });

  } catch (error) {
    console.error("Error setting up listener:", error);
    return () => {}; // Return empty unsubscribe function
  }
};

export { auth, db };