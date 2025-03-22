import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize the color picker on page load
window.addEventListener("load", initializeColorPicker);

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("list.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid'); // Get the UID from the URL parameter
    let storedSortOrder = 'default'; // Default sorting order

    onAuthStateChanged(auth, (user) => {
      let targetUserId; // The user whose list is being displayed
      let isOwner = false; // Whether the current user is the owner of the list

      if (uidParam) {
        // If a UID parameter is provided, display that user's list
        targetUserId = uidParam;
        isOwner = user !== null && user.uid === targetUserId; // Check if the current user is the owner
        // Use default sorting for others' lists
        storedSortOrder = isOwner ? localStorage.getItem("sortOrder") || 'default' : 'default';
      } else {
        // If no UID parameter is provided, display the current user's list
        if (!user) {
          alert("You need to log in to view your album list.");
          window.location.href = "login.html";
          return;
        }
        targetUserId = user.uid; // Use the current user's UID
        isOwner = true; // The current user is the owner
        storedSortOrder = localStorage.getItem("sortOrder") || 'default'; // Use stored sort order
      }

      // Fetch and display albums for the target user
      fetchAndDisplayAlbums(targetUserId, storedSortOrder, isOwner);

      // Add interactions (e.g., score dropdown, remove button) only if the current user is the owner
      if (isOwner) {
        addAlbumInteractions(targetUserId);
        addScoreHeaderListener(targetUserId);
      }
    });
  }
});

// Fetch and display albums without a container
async function fetchAndDisplayAlbums(userId, sortOrder = 'default', isOwner = true) {
  try {
    const tbody = document.querySelector('.album-table tbody');
    tbody.innerHTML = ''; // Clear existing content

    const albumsRef = collection(db, 'users', userId, 'albums');
    const querySnapshot = await getDocs(albumsRef);

    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No albums saved yet.</td></tr>`;
      return;
    }

    let albums = [];
    querySnapshot.forEach((docSnap) => {
      const album = docSnap.data();
      album.id = docSnap.id; // Firestore document ID
      album.score = album.score || null;  // Ensure score is either a valid value or null
      albums.push(album);
    });

    // Sort albums based on the sortOrder
    if (sortOrder === 'desc') {
      albums.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortOrder === 'asc') {
      albums.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else {
      // Default sorting (by rank)
      albums.sort((a, b) => a.rank - b.rank);
    }

    let rank = 1;
    albums.forEach((album) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${rank++}</td>
        <td><img src="${album.image}" alt="${album.name}" width="100"></td>
        <td>${album.name}</td>
        <td>
          <select class="score-dropdown" data-album-id="${album.id}" ${isOwner ? '' : 'disabled'}>
            ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
              .map(opt => `<option ${album.score === opt ? 'selected' : (album.score === null && opt === '-') ? 'selected' : ''}>${opt}</option>`)
              .join('')}
          </select>
        </td>
        <td>${album.release_date}</td>
        <td>${isOwner ? `<button class="remove-btn" data-album-id="${album.id}">-</button>` : ''}</td>
      `;

      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    document.querySelector('.album-table tbody').innerHTML =
      `<tr><td colspan="5" style="color:red;text-align:center">Error loading albums</td></tr>`;
  }
}

// Add event listeners for interactions (only for the owner)
function addAlbumInteractions(userId) {
  // Update score in the Firestore when dropdown value is changed
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      const userAlbumId = e.target.dataset.albumId; // Firestore document ID of the user's album
      const selectedScore = e.target.value === '-' ? null : e.target.value;

      // Update the user's album score
      const userAlbumRef = doc(db, 'users', userId, 'albums', userAlbumId);
      await updateDoc(userAlbumRef, { score: selectedScore });

      // Fetch the Spotify ID from the user's album document
      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = userAlbumSnap.data().spotifyId; // Spotify ID of the album
      const globalAlbumRef = doc(db, 'albums', spotifyId);
      const userRatingRef = doc(globalAlbumRef, 'ratings', userId);

      // Get previous rating (if exists)
      const userRatingSnap = await getDoc(userRatingRef);
      const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

      // Use transaction to update global album stats
      try {
        await runTransaction(db, async (transaction) => {
          const albumSnap = await transaction.get(globalAlbumRef);
          const albumData = albumSnap.exists() ? albumSnap.data() : {
            totalScore: 0,
            numberOfRatings: 0,
            averageScore: 0,
            name: userAlbumSnap.data().name, // Fallback to user's album data
            image: userAlbumSnap.data().image
          };

          // Ensure totalScore and numberOfRatings are numbers
          let totalScore = Number(albumData.totalScore) || 0;
          let numberOfRatings = Number(albumData.numberOfRatings) || 0;

          // Subtract old rating if exists
          if (oldRating !== null) {
            totalScore -= Number(oldRating) || 0;
          }

          // Add new rating
          if (selectedScore !== null) {
            const newRating = Number(selectedScore) || 0;
            totalScore += newRating;
            if (oldRating === null) numberOfRatings += 1; // New rating
          } else {
            numberOfRatings = Math.max(numberOfRatings - 1, 0); // Prevent negatives
          }

          // Clamp values to prevent invalid numbers
          totalScore = Math.max(totalScore, 0); // Ensure totalScore >= 0
          numberOfRatings = Math.max(numberOfRatings, 0); // Ensure numberOfRatings >= 0

          // Calculate new average
          const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

          // Update or create the album document
          transaction.set(globalAlbumRef, {
            ...albumData,
            totalScore,
            numberOfRatings,
            averageScore
          }, { merge: true });

          // Update/delete the rating subcollection
          if (selectedScore !== null) {
            transaction.set(userRatingRef, { rating: Number(selectedScore) || 0 });
          } else {
            transaction.delete(userRatingRef);
          }
        });
        console.log("Global stats updated!");
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }
  });

  // Remove album from Firestore when the remove button is clicked
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn') && confirm("Are you sure you want to remove this album?")) {
      const userAlbumId = e.target.dataset.albumId;
      const userAlbumRef = doc(db, 'users', userId, 'albums', userAlbumId);

      // Retrieve the Spotify ID from the user's album document
      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = userAlbumSnap.data().spotifyId;
      const globalAlbumRef = doc(db, 'albums', spotifyId);
      const userRatingRef = doc(globalAlbumRef, 'ratings', userId);

      // Get previous rating (if exists)
      const userRatingSnap = await getDoc(userRatingRef);
      const oldRating = userRatingSnap.exists() ? userRatingSnap.data().rating : null;

      // Use transaction to update global album stats
      try {
        await runTransaction(db, async (transaction) => {
          const albumSnap = await transaction.get(globalAlbumRef);
          if (albumSnap.exists()) {
            const albumData = albumSnap.data();
            // Ensure totalScore and numberOfRatings are numbers
            let totalScore = Number(albumData.totalScore) || 0;
            let numberOfRatings = Number(albumData.numberOfRatings) || 0;

            // Subtract old rating if exists
            if (oldRating !== null) {
              totalScore -= Number(oldRating) || 0;
              numberOfRatings = Math.max(numberOfRatings - 1, 0); // Prevent negatives
            }

            // Calculate new average
            const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

            // Update the album document
            transaction.set(globalAlbumRef, {
              ...albumData,
              totalScore,
              numberOfRatings,
              averageScore
            }, { merge: true });
          }

          // Delete the user's rating
          transaction.delete(userRatingRef);
        });

        // Delete the user's album
        await deleteDoc(userAlbumRef);
        e.target.closest('tr').remove();
        console.log("Album removed and global stats updated!");
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }
  });
}

// Add event listener to the score header for sorting (only for the owner)
function addScoreHeaderListener(userId) {
  const scoreHeader = document.querySelector('.album-table th:nth-child(4)'); // Assuming the score header is the 4th column
  let sortOrder = localStorage.getItem("sortOrder") || 'default'; // Get the stored sort order

  if (scoreHeader) {
    scoreHeader.addEventListener('click', () => {
      if (sortOrder === 'default') {
        sortOrder = 'desc';
      } else if (sortOrder === 'desc') {
        sortOrder = 'asc';
      } else {
        sortOrder = 'default';
      }

      // Store the sort order in localStorage for persistence
      localStorage.setItem("sortOrder", sortOrder);

      fetchAndDisplayAlbums(userId, sortOrder, true); // Fetch and display albums with updated sorting
    });
  }
}

// Color picker logic (unchanged)
function initializeColorPicker() {
  const changeColorBtn = document.getElementById("changeColorBtn");
  const colorModal = document.getElementById("colorModal");
  const closeModal = document.querySelector(".close");
  const backgroundColorPicker = document.getElementById("backgroundColorPicker");
  const fontColorPicker = document.getElementById("fontColorPicker");

  if (!changeColorBtn || !colorModal || !closeModal || !backgroundColorPicker || !fontColorPicker) return;

  // Retrieve the saved background color from localStorage and apply it if available
  const savedBackgroundColor = localStorage.getItem("backgroundColor");
  if (savedBackgroundColor) {
    document.body.style.backgroundColor = savedBackgroundColor;
    backgroundColorPicker.value = savedBackgroundColor;
  }

  // Retrieve the saved font color from localStorage and apply it if available
  const savedFontColor = localStorage.getItem("fontColor");
  if (savedFontColor) {
    // Apply font color to all elements except the modal
    applyFontColor(savedFontColor);
    fontColorPicker.value = savedFontColor;
  }

  // Open the color picker modal
  changeColorBtn.addEventListener("click", () => colorModal.style.display = "flex");

  // Close the modal when the close button is clicked
  closeModal.addEventListener("click", () => colorModal.style.display = "none");

  // Close the modal when clicking outside the modal
  window.addEventListener("click", (e) => e.target === colorModal && (colorModal.style.display = "none"));

  // Update the background color when the background color picker input changes
  backgroundColorPicker.addEventListener("input", (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("backgroundColor", e.target.value); // Save background color to localStorage
  });

  // Update the font color when the font color picker input changes
  fontColorPicker.addEventListener("input", (e) => {
    const selectedFontColor = e.target.value;
    applyFontColor(selectedFontColor); // Apply font color to all elements except the modal
    localStorage.setItem("fontColor", selectedFontColor); // Save font color to localStorage
  });
}

// Helper function to apply font color to all elements except the modal
function applyFontColor(color) {
  const allElements = document.querySelectorAll("body *:not(.modal *)"); // Select all elements except those inside the modal
  allElements.forEach(element => {
    element.style.color = color;
  });
}