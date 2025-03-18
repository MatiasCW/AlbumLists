import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize the color picker on page load
window.addEventListener("load", initializeColorPicker);

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("list.html")) {
    // Use auth state listener to handle login status
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is logged in. Fetching albums...");

        // Retrieve the stored sort order from localStorage (default to 'default')
        const storedSortOrder = localStorage.getItem("sortOrder") || 'default';

        fetchAndDisplayAlbums(user.uid, storedSortOrder);  // Fetch albums with the stored sort order
        addAlbumInteractions(user.uid);
        addScoreHeaderListener(user.uid); // Add listener for score header
      } else {
        alert("You need to log in to view your album list.");
        window.location.href = "login.html";
      }
    });
  }
});

// Fetch and display albums without a container
async function fetchAndDisplayAlbums(userId, sortOrder = 'default') {
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
          <select class="score-dropdown" data-album-id="${album.id}"> <!-- Use Firestore document ID -->
            ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
          .map(opt => `<option ${album.score === opt ? 'selected' : (album.score === null && opt === '-') ? 'selected' : ''}>${opt}</option>`)
          .join('')}
          </select>
        </td>
        <td>${album.release_date}</td>
        <td><button class="remove-btn" data-album-id="${album.id}">×</button></td>
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

          let { totalScore, numberOfRatings } = albumData;

          // Subtract old rating if exists
          if (oldRating !== null) totalScore -= oldRating;

          // Add new rating
          if (selectedScore !== null) {
            const newRating = parseInt(selectedScore);
            totalScore += newRating;
            if (oldRating === null) numberOfRatings += 1; // New rating
          } else {
            numberOfRatings = Math.max(numberOfRatings - 1, 0); // Prevent negatives
          }

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
            transaction.set(userRatingRef, { rating: parseInt(selectedScore) });
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
      // Inside the remove event listener's transaction
      try {
        await runTransaction(db, async (transaction) => {
          const albumSnap = await transaction.get(globalAlbumRef);
          if (albumSnap.exists()) {
            const albumData = albumSnap.data();
            // Ensure totalScore and numberOfRatings are numbers, defaulting to 0 if missing
            let totalScore = albumData.totalScore || 0;
            let numberOfRatings = albumData.numberOfRatings || 0;

            // Subtract old rating if exists
            if (oldRating !== null) {
              totalScore -= oldRating;
              numberOfRatings = Math.max(numberOfRatings - 1, 0); // Prevent negatives
            }

            // Calculate new average
            const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

            // Update the album document
            transaction.set(globalAlbumRef, {
              ...albumData, // Preserve existing fields
              totalScore,
              numberOfRatings,
              averageScore
            }, { merge: true });
          }

          // Delete the user's rating regardless of album existence
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

// Add event listener to the score header for sorting
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

      fetchAndDisplayAlbums(userId, sortOrder); // Fetch and display albums with updated sorting
    });
  }
}

// Color picker logic
function initializeColorPicker() {
  const changeColorBtn = document.getElementById("changeColorBtn");
  const colorModal = document.getElementById("colorModal");
  const closeModal = document.querySelector(".close");
  const colorPicker = document.getElementById("colorPicker");

  if (!changeColorBtn || !colorModal || !closeModal || !colorPicker) return;

  // Retrieve the saved color from localStorage and apply it if available
  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    colorPicker.value = savedColor;
  }

  // Open the color picker modal
  changeColorBtn.addEventListener("click", () => colorModal.style.display = "flex");

  // Close the modal when the close button is clicked
  closeModal.addEventListener("click", () => colorModal.style.display = "none");

  // Close the modal when clicking outside the modal
  window.addEventListener("click", (e) => e.target === colorModal && (colorModal.style.display = "none"));

  // Update the background color when the color picker input changes
  colorPicker.addEventListener("input", (e) => {
    document.body.style.backgroundColor = e.target.value;
    localStorage.setItem("backgroundColor", e.target.value); // Save color to localStorage
  });
}