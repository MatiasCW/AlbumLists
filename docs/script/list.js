import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize the color picker on page load
window.addEventListener("load", initializeColorPicker);

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("list.html")) {
    // Use auth state listener to handle login status
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in - fetch and display albums
        console.log("User is logged in. Fetching albums...");
        fetchAndDisplayAlbums(user.uid);
        addAlbumInteractions(user.uid);
      } else {
        // User is not logged in - redirect to login
        alert("You need to log in to view your album list.");
        window.location.href = "login.html";
      }
    });
  }
});

// Fetch and display albums
async function fetchAndDisplayAlbums(userId) {
  const albumContainer = document.querySelector(".album-container");
  if (!albumContainer) {
    console.error("Album container not found!");
    return;
  }

  try {
    const albumsRef = collection(db, 'users', userId, 'albums');
    const querySnapshot = await getDocs(albumsRef);

    console.log("Fetched Albums:", querySnapshot.docs.map(doc => doc.data())); // Debugging

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
            <div class="album-actions">
              <select class="score-dropdown" data-album-id="${doc.id}">
                ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
                  .map(opt => `<option ${album.score === opt ? 'selected' : ''}>${opt}</option>`)
                  .join('')}
              </select>
              <button class="remove-btn" data-album-id="${doc.id}">Remove</button>
            </div>
          </div>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching albums:", error);
    albumContainer.innerHTML = "<p>Error loading albums. Please try again.</p>";
  }
}

// Add event listeners for interactions
function addAlbumInteractions(userId) {
  // Score updates
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      console.log("Score dropdown changed. Updating score...");
      const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
      updateDoc(albumRef, { score: e.target.value })
        .then(() => console.log("Score updated!"))
        .catch((error) => console.error("Error updating score:", error));
    }
  });

  // Album removal
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn') && confirm("Are you sure?")) {
      console.log("Remove button clicked. Deleting album...");
      const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
      deleteDoc(albumRef)
        .then(() => {
          console.log("Album removed!");
          e.target.closest('.album').remove();
        })
        .catch((error) => console.error("Error removing album:", error));
    }
  });
}

// Color picker logic
function initializeColorPicker() {
  const changeColorBtn = document.getElementById("changeColorBtn");
  const colorModal = document.getElementById("colorModal");
  const closeModal = document.querySelector(".close");
  const colorPicker = document.getElementById("colorPicker");

  if (!changeColorBtn || !colorModal || !closeModal || !colorPicker) return;

  // Load saved color
  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    colorPicker.value = savedColor;
  }

  // Event listeners
  changeColorBtn.addEventListener("click", () => colorModal.style.display = "flex");
  closeModal.addEventListener("click", () => colorModal.style.display = "none");
  window.addEventListener("click", (e) => e.target === colorModal && (colorModal.style.display = "none"));
  colorPicker.addEventListener("input", (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("backgroundColor", e.target.value);
  });
}