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

// Fetch and display albums in table
async function fetchAndDisplayAlbums(userId) {
  const albumTableBody = document.querySelector(".album-table tbody");
  if (!albumTableBody) {
    console.error("Album table body not found!");
    return;
  }

  try {
    const albumsRef = collection(db, 'users', userId, 'albums');
    const querySnapshot = await getDocs(albumsRef);

    console.log("Fetched Albums:", querySnapshot.docs.map(doc => doc.data())); // Debugging

    if (querySnapshot.empty) {
      albumTableBody.innerHTML = "<tr><td colspan='6'>No albums saved yet.</td></tr>";
      return;
    }

    // Insert albums as table rows
    albumTableBody.innerHTML = querySnapshot.docs
      .map((doc, index) => {
        const album = doc.data();
        return `
          <tr data-album-id="${doc.id}">
            <td>${index + 1}</td>
            <td><img src="${album.image}" alt="${album.name}" width="50"></td>
            <td>${album.name}</td>
            <td>
              <select class="score-dropdown">
                ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
                  .map(opt => `<option ${album.score === opt ? 'selected' : ''}>${opt}</option>`)
                  .join('')}
              </select>
            </td>
            <td>${album.release_date}</td>
            <td>
              <button class="remove-btn">Remove</button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching albums:", error);
    albumTableBody.innerHTML = "<tr><td colspan='6'>Error loading albums. Please try again.</td></tr>";
  }
}

// Add event listeners for interactions
function addAlbumInteractions(userId) {
  const albumTableBody = document.querySelector(".album-table tbody");

  // Score updates
  albumTableBody.addEventListener('change', async (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      console.log("Score dropdown changed. Updating score...");
      const row = e.target.closest("tr");
      const albumId = row.dataset.albumId;

      try {
        await updateDoc(doc(db, 'users', userId, 'albums', albumId), { score: e.target.value });
        console.log("Score updated!");
      } catch (error) {
        console.error("Error updating score:", error);
      }
    }
  });

  // Album removal
  albumTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn') && confirm("Are you sure?")) {
      console.log("Remove button clicked. Deleting album...");
      const row = e.target.closest("tr");
      const albumId = row.dataset.albumId;

      try {
        await deleteDoc(doc(db, 'users', userId, 'albums', albumId));
        console.log("Album removed!");
        row.remove(); // Remove row from table
      } catch (error) {
        console.error("Error removing album:", error);
      }
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
