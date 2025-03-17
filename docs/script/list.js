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
        console.log("User is logged in. Fetching albums...");
        fetchAndDisplayAlbums(user.uid);
        addAlbumInteractions(user.uid);
      } else {
        alert("You need to log in to view your album list.");
        window.location.href = "login.html";
      }
    });
  }
});

// Fetch and display albums without a container
async function fetchAndDisplayAlbums(userId) {
  try {
    const tbody = document.querySelector('.album-table tbody');
    tbody.innerHTML = ''; // Clear existing content

    const albumsRef = collection(db, 'users', userId, 'albums');
    const querySnapshot = await getDocs(albumsRef);

    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No albums saved yet.</td></tr>`;
      return;
    }

    let rank = 1;
    querySnapshot.forEach((docSnap) => {
      const album = docSnap.data();
      const row = document.createElement("tr");
      
      row.innerHTML = `
        <td>${rank++}</td>
        <td><img src="${album.image}" alt="${album.name}" width="100"></td>
        <td>${album.name}</td>
        <td>
          <select class="score-dropdown" data-album-id="${docSnap.id}">
            ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
              .map(opt => `<option ${album.score === opt ? 'selected' : ''}>${opt}</option>`)
              .join('')}
          </select>
        </td>
        <td>${album.release_date}</td>
        <td><button class="remove-btn" data-album-id="${docSnap.id}">×</button></td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    document.querySelector('.album-table tbody').innerHTML = 
      `<tr><td colspan="5" style="color:red;text-align:center">Error loading albums</td></tr>`;
  }
}

// Add event listeners for interactions
function addAlbumInteractions(userId) {
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      console.log("Score dropdown changed. Updating score...");
      const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
      updateDoc(albumRef, { score: e.target.value })
        .then(() => console.log("Score updated!"))
        .catch((error) => console.error("Error updating score:", error));
    }
  });

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

  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    colorPicker.value = savedColor;
  }

  changeColorBtn.addEventListener("click", () => colorModal.style.display = "flex");
  closeModal.addEventListener("click", () => colorModal.style.display = "none");
  window.addEventListener("click", (e) => e.target === colorModal && (colorModal.style.display = "none"));
  colorPicker.addEventListener("input", (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("backgroundColor", e.target.value);
  });
}
