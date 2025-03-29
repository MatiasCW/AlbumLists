import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Initialize the color picker on page load
window.addEventListener("load", initializeColorPicker);

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("list.html")) {
    const urlParams = new URLSearchParams(window.location.search);
    const uidParam = urlParams.get('uid');
    let storedSortOrder = localStorage.getItem("sortOrder") || 'default';

    onAuthStateChanged(auth, (user) => {
      let targetUserId;
      let isOwner = false;

      if (uidParam) {
        targetUserId = uidParam;
        isOwner = user !== null && user.uid === targetUserId;
      } else {
        if (!user) {
          alert("You need to log in to view your album list.");
          window.location.href = "login.html";
          return;
        }
        targetUserId = user.uid;
        isOwner = true;
      }

      fetchAndDisplayAlbums(targetUserId, storedSortOrder, isOwner);

      if (isOwner) {
        addAlbumInteractions(targetUserId);
      }

      addScoreHeaderListener(targetUserId, isOwner);
    });
  }
});

async function fetchAndDisplayAlbums(userId, sortOrder = 'default', isOwner = true) {
  try {
    const tbody = document.querySelector('.album-table tbody');
    tbody.innerHTML = '';

    const albumsRef = collection(db, 'users', userId, 'albums');
    const querySnapshot = await getDocs(albumsRef);

    if (querySnapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">No albums saved yet.</td></tr>`;
      return;
    }

    let albums = [];
    querySnapshot.forEach((docSnap) => {
      const album = docSnap.data();
      album.id = docSnap.id;
      album.score = album.score || null;
      albums.push(album);
    });

    if (sortOrder === 'desc') {
      albums.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortOrder === 'asc') {
      albums.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else {
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
          ${isOwner ? `
            <select class="score-dropdown" data-album-id="${album.id}">
              ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
                .map(opt => `<option ${album.score === opt ? 'selected' : (album.score === null && opt === '-') ? 'selected' : ''}>${opt}</option>`)
                .join('')}
            </select>
          ` : (album.score || '-')}
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

function addAlbumInteractions(userId) {
  // Score update handler
  document.addEventListener('change', async (e) => {
    if (e.target.classList.contains('score-dropdown')) {
      const userAlbumId = e.target.dataset.albumId;
      const selectedScore = e.target.value === '-' ? null : e.target.value;

      const userAlbumRef = doc(db, 'users', userId, 'albums', userAlbumId);
      await updateDoc(userAlbumRef, { score: selectedScore });

      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = userAlbumSnap.data().spotifyId;
      const globalAlbumRef = doc(db, 'albums', spotifyId);
      
      // Changed to use userId as the document ID in ratings subcollection
      const userRatingRef = doc(globalAlbumRef, 'ratings', userId);

      try {
        await runTransaction(db, async (transaction) => {
          const albumSnap = await transaction.get(globalAlbumRef);
          const albumData = albumSnap.exists() ? albumSnap.data() : {
            totalScore: 0,
            numberOfRatings: 0,
            averageScore: 0,
            name: userAlbumSnap.data().name,
            image: userAlbumSnap.data().image
          };

          // Get previous rating if exists
          const ratingSnap = await transaction.get(userRatingRef);
          const oldRating = ratingSnap.exists() ? ratingSnap.data().rating : null;

          let totalScore = Number(albumData.totalScore) || 0;
          let numberOfRatings = Number(albumData.numberOfRatings) || 0;

          // Adjust for old rating
          if (oldRating !== null) {
            totalScore -= Number(oldRating);
          }

          // Apply new rating
          if (selectedScore !== null) {
            const newRating = Number(selectedScore);
            totalScore += newRating;
            if (oldRating === null) numberOfRatings += 1;
            transaction.set(userRatingRef, { rating: newRating });
          } else {
            numberOfRatings = Math.max(numberOfRatings - 1, 0);
            transaction.delete(userRatingRef);
          }

          // Calculate new average
          const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;

          // Update global album
          transaction.set(globalAlbumRef, {
            ...albumData,
            totalScore,
            numberOfRatings,
            averageScore
          }, { merge: true });
        });
        console.log("Score updated successfully");
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }
  });

  // Album removal handler
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn') && confirm("Are you sure you want to remove this album?")) {
      const userAlbumId = e.target.dataset.albumId;
      const userAlbumRef = doc(db, 'users', userId, 'albums', userAlbumId);

      const userAlbumSnap = await getDoc(userAlbumRef);
      if (!userAlbumSnap.exists()) return;

      const spotifyId = userAlbumSnap.data().spotifyId;
      const globalAlbumRef = doc(db, 'albums', spotifyId);
      const userRatingRef = doc(globalAlbumRef, 'ratings', userId);

      try {
        await runTransaction(db, async (transaction) => {
          // Get current album data
          const albumSnap = await transaction.get(globalAlbumRef);
          if (!albumSnap.exists()) return;

          const albumData = albumSnap.data();
          let totalScore = Number(albumData.totalScore) || 0;
          let numberOfRatings = Number(albumData.numberOfRatings) || 0;

          // Get and remove the user's rating
          const ratingSnap = await transaction.get(userRatingRef);
          if (ratingSnap.exists()) {
            totalScore -= Number(ratingSnap.data().rating) || 0;
            numberOfRatings = Math.max(numberOfRatings - 1, 0);
            transaction.delete(userRatingRef);
          }

          // Update album stats
          const averageScore = numberOfRatings > 0 ? totalScore / numberOfRatings : 0;
          transaction.set(globalAlbumRef, {
            ...albumData,
            totalScore,
            numberOfRatings,
            averageScore
          }, { merge: true });
        });

        // Remove the album from user's collection
        await deleteDoc(userAlbumRef);
        e.target.closest('tr').remove();
        console.log("Album removed successfully");
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }
  });
}

// Add event listener to the score header for sorting (available to all users)
function addScoreHeaderListener(userId, isOwner) {
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

      // Fetch and display albums with updated sorting
      fetchAndDisplayAlbums(userId, sortOrder, isOwner);
    });
  }
}

// Modify initializeColorPicker to use Firestore
function initializeColorPicker() {
  const changeColorBtn = document.getElementById("changeColorBtn");
  const colorModal = document.getElementById("colorModal");
  const closeModal = document.querySelector(".close");
  const backgroundColorPicker = document.getElementById("backgroundColorPicker");
  const fontColorPicker = document.getElementById("fontColorPicker");

  if (!changeColorBtn || !colorModal || !closeModal || !backgroundColorPicker || !fontColorPicker) return;

  const urlParams = new URLSearchParams(window.location.search);
  const uidParam = urlParams.get('uid');
  let isOwner = !uidParam; // If no UID param, assume owner

  // Only show style button if owner
  changeColorBtn.style.display = isOwner ? 'block' : 'none';

  onAuthStateChanged(auth, async (user) => {
    if (!isOwner && uidParam) {
      // Apply owner's style when viewing someone else's list
      const ownerDoc = await getDoc(doc(db, 'users', uidParam));
      if (ownerDoc.exists()) {
        const { backgroundColor, fontColor } = ownerDoc.data();
        applyColors(backgroundColor, fontColor);
      }
    } else if (user) {
      // Load owner's style from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const { backgroundColor, fontColor } = userDoc.data();
        applyColors(backgroundColor, fontColor);
        backgroundColorPicker.value = backgroundColor || '#ffffff';
        fontColorPicker.value = fontColor || '#000000';
      }
    }
  });

  // Update color picker handlers
  backgroundColorPicker.addEventListener("input", async (e) => {
    const color = e.target.value;
    document.body.style.backgroundColor = color;
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        backgroundColor: color
      });
    }
  });

  fontColorPicker.addEventListener("input", async (e) => {
    const color = e.target.value;
    applyFontColor(color);
    if (auth.currentUser) {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        fontColor: color
      });
    }
  });

  // Rest of modal handling remains the same
  changeColorBtn.addEventListener("click", () => colorModal.style.display = "flex");
  closeModal.addEventListener("click", () => colorModal.style.display = "none");
  window.addEventListener("click", (e) => e.target === colorModal && (colorModal.style.display = "none"));
}

// Helper to apply both colors
function applyColors(bgColor, fontColor) {
  if (bgColor) document.body.style.backgroundColor = bgColor;
  if (fontColor) applyFontColor(fontColor);
}

// Modified applyFontColor
function applyFontColor(color) {
  const allElements = document.querySelectorAll("body *:not(.modal *)");
  allElements.forEach(element => {
    element.style.color = color;
  });
}