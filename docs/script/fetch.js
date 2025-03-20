import { auth, db } from "./firebase.js";
import { collection, addDoc, getDocs, query, where, doc, deleteDoc, setDoc, runTransaction } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

const clientId = '2b46bd9e8aef47908b9b92deac88846b';
const clientSecret = '681a685c75e542c49f101ae8909f3be8';
let accessToken = '';

// Fetch access token once and store it
function fetchAccessToken() {
  const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);

  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
    .then(response => response.json())
    .then(data => {
      accessToken = data.access_token;
      console.log('Access Token:', accessToken);

      // If we're on albums.html, fetch albums
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('artistId')) {
        fetchAlbums(urlParams.get('artistId'));
      }
    })
    .catch(error => console.error('Error:', error));
}

// Search for an artist and redirect to albums.html
function searchArtist(artistName) {
  if (!accessToken) {
    console.error('Access token is missing.');
    return;
  }

  fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })
    .then(response => response.json())
    .then(data => {
      if (data.artists.items.length === 0) {
        console.error('Artist not found.');
        return;
      }

      const artistId = data.artists.items[0].id;
      console.log(`Artist ID for ${artistName}:`, artistId);

      // Redirect to albums.html with artistId as a URL parameter
      window.location.href = `albums.html?artistId=${artistId}`;
    })
    .catch(error => console.error('Error searching artist:', error));
}

// Fetch albums of the artist using their ID
function fetchAlbums(artistId) {
  let albums = []; // Array to hold all albums

  function fetchAllAlbums(url) {
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error('Error fetching albums:', data.error);
          return;
        }

        // Filter only full albums (exclude singles and compilations)
        const filteredAlbums = data.items.filter(album => album.album_type === 'album');
        
        // Push albums into the array
        albums = [...albums, ...filteredAlbums];

        // Display the albums
        displayAlbums(albums);

        // If there are more albums (pagination), fetch the next page
        if (data.next) {
          fetchAllAlbums(data.next);
        }
      })
      .catch(error => console.error('Error:', error));
  }

  // Initial album request
  fetchAllAlbums(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album`);
}

// Display albums in HTML
async function displayAlbums(albums) {
  const output = document.querySelector(".album-container");
  output.innerHTML = ''; // Clear previous content

  const user = auth.currentUser;
  let userAlbumIds = new Set();

  if (user) {
    // Fetch user's albums to determine added status
    const albumsRef = collection(db, 'users', user.uid, 'albums');
    const querySnapshot = await getDocs(albumsRef);
    querySnapshot.forEach(doc => {
      userAlbumIds.add(doc.data().spotifyId);
    });
  }

  albums.forEach(album => {
    const albumElement = document.createElement('div');
    albumElement.classList.add('album');

    const isAdded = userAlbumIds.has(album.id);
    const buttonText = isAdded ? '-' : '+';
    const buttonClass = isAdded ? 'remove-btn' : 'add-btn';

    albumElement.innerHTML = ` 
      <h3>${album.name}</h3>
      <p><strong>Release Date:</strong> ${album.release_date}</p>
      <img src="${album.images[0]?.url}" alt="${album.name}" width="100">
      <button class="${buttonClass}" 
              data-album-id="${album.id}"
              data-album-name="${album.name}"
              data-release-date="${album.release_date}"
              data-image-url="${album.images[0]?.url}">
        ${buttonText}
      </button>
    `;

    const button = albumElement.querySelector('button');
    button.addEventListener('click', async function() {
      if (this.classList.contains('add-btn')) {
        await addAlbumToList(
          album.id,
          album.name,
          album.release_date,
          album.images[0]?.url,
          this
        );
      } else {
        await removeAlbumFromList(album.id, this);
      }
    });

    output.appendChild(albumElement);
  });
}

// Function to add album to the user's list in Firestore
async function addAlbumToList(spotifyAlbumId, albumName, albumReleaseDate, albumImageUrl, buttonElement) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to add albums to your list.");
    return;
  }

  try {
    const albumsRef = collection(db, 'users', user.uid, 'albums');
    const q = query(albumsRef, where('spotifyId', '==', spotifyAlbumId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(albumsRef, {
        spotifyId: spotifyAlbumId,
        name: albumName,
        release_date: albumReleaseDate,
        image: albumImageUrl,
        createdAt: new Date()
      });

      const globalAlbumRef = doc(db, "albums", spotifyAlbumId);
      await setDoc(globalAlbumRef, {
        name: albumName,
        image: albumImageUrl,
      }, { merge: true });

      // Update button to remove state
      buttonElement.textContent = '-';
      buttonElement.classList.replace('add-btn', 'remove-btn');
    }
  } catch (error) {
    console.error("Error adding album: ", error);
  }
}

// Function to remove album from the user's list in Firestore
async function removeAlbumFromList(spotifyAlbumId, buttonElement) {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to remove albums.");
    return;
  }

  try {
    // Delete user's album
    const albumsRef = collection(db, 'users', user.uid, 'albums');
    const q = query(albumsRef, where('spotifyId', '==', spotifyAlbumId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = doc(db, 'users', user.uid, 'albums', querySnapshot.docs[0].id);
      await deleteDoc(docRef);
    }

    // Update global stats (similar to list.js)
    const globalAlbumRef = doc(db, 'albums', spotifyAlbumId);
    const userRatingRef = doc(globalAlbumRef, 'ratings', user.uid);

    await runTransaction(db, async (transaction) => {
      const albumSnap = await transaction.get(globalAlbumRef);
      if (!albumSnap.exists()) return;

      const albumData = albumSnap.data();
      let totalScore = Number(albumData.totalScore) || 0;
      let numberOfRatings = Number(albumData.numberOfRatings) || 0;

      const ratingSnap = await transaction.get(userRatingRef);
      if (ratingSnap.exists()) {
        totalScore -= Number(ratingSnap.data().rating);
        numberOfRatings = Math.max(numberOfRatings - 1, 0);
      }

      transaction.update(globalAlbumRef, {
        totalScore,
        numberOfRatings,
        averageScore: numberOfRatings > 0 ? totalScore / numberOfRatings : 0
      });
      transaction.delete(userRatingRef);
    });

    // Update button to add state
    buttonElement.textContent = '+';
    buttonElement.classList.replace('remove-btn', 'add-btn');
  } catch (error) {
    console.error("Error removing album: ", error);
  }
}

// Initialize access token on page load
fetchAccessToken();

// Handle search input
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('artistSearch');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        const artistName = event.target.value.trim();
        if (artistName) {
          searchArtist(artistName);
        }
      }
    });
  }
});

// Firebase Authentication state listener
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user);
  } else {
    console.log('No user logged in');
  }
});