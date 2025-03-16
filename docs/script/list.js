import { auth, db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if the current page is list.html
  if (window.location.pathname.includes("list.html")) {
    // Get the logged-in user
    const user = auth.currentUser;

    if (!user) {
      alert("You need to log in to view your album list.");
      window.location.href = "login.html";
      return;
    }

    // Reference to the user's albums collection in Firestore
    const albumsRef = collection(db, 'users', user.uid, 'albums');
    const albumContainer = document.querySelector(".album-container");

    try {
      // Get all documents from the albums collection
      const querySnapshot = await getDocs(albumsRef);
      
      if (querySnapshot.empty) {
        albumContainer.innerHTML = "<p>No albums saved yet.</p>";
        return;
      }

      // Display each saved album
      albumContainer.innerHTML = querySnapshot.docs
        .map(doc => {
          const album = doc.data();
          return `
            <div class="album">
              <h3>${album.name}</h3>
              <p><strong>Release Date:</strong> ${album.release_date}</p>
              <img src="${album.image}" alt="${album.name}" width="100">
            </div>
          `;
        })
        .join("");
        
    } catch (error) {
      console.error("Error fetching albums:", error);
      albumContainer.innerHTML = "<p>Error loading albums. Please try again.</p>";
    }
  }
});

// Rest of your color picker code remains the same
const changeColorBtn = document.getElementById("changeColorBtn");
const colorModal = document.getElementById("colorModal");
const closeModal = document.querySelector(".close");
const colorPicker = document.getElementById("colorPicker");

changeColorBtn.addEventListener("click", () => {
  colorModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  colorModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === colorModal) {
    colorModal.style.display = "none";
  }
});

colorPicker.addEventListener("input", (event) => {
  const selectedColor = event.target.value;
  document.body.style.backgroundColor = selectedColor;
  localStorage.setItem("backgroundColor", selectedColor);
});

window.addEventListener("load", () => {
  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    colorPicker.value = savedColor;
  }
});