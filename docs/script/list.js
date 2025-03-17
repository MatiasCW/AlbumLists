import { auth, db } from './firebase.js';
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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

      // Add event listeners for score dropdowns and remove buttons
      addAlbumInteractions(user.uid);
        
    } catch (error) {
      console.error("Error fetching albums:", error);
      albumContainer.innerHTML = "<p>Error loading albums. Please try again.</p>";
    }
  }
});

// Add event listeners for score dropdowns and remove buttons
function addAlbumInteractions(userId) {
  // Score updates
  document.querySelectorAll('.score-dropdown').forEach(dropdown => {
    dropdown.addEventListener('change', async (e) => {
      const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
      try {
        await updateDoc(albumRef, { score: e.target.value });
        alert("Score updated successfully!");
      } catch (error) {
        console.error("Error updating album score:", error);
        alert("Error updating score. Please try again.");
      }
    });
  });

  // Album removal
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (confirm("Are you sure you want to remove this album?")) {
        const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
        try {
          await deleteDoc(albumRef);
          e.target.closest('.album').remove(); // Remove the album from the DOM
          alert("Album removed successfully!");
        } catch (error) {
          console.error("Error removing album:", error);
          alert("Error removing album. Please try again.");
        }
      }
    });
  });
}

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