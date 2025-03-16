const clientId = '2b46bd9e8aef47908b9b92deac88846b';  // Replace with your Spotify Client ID
const clientSecret = '774c6a6cf06b4595ad2bb6f776d8ff23';  // Replace with your Spotify Client Secret
let accessToken = '';

// Fetch access token once and store it
function fetchAccessToken() {
  const auth = 'Basic ' + btoa(`${clientId}:${clientSecret}`);

  return fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': auth,
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
function displayAlbums(albums) {
  const output = document.querySelector(".album-container");
  output.innerHTML = ''; // Clear previous content

  if (albums.length === 0) {
      output.textContent = 'No albums found.';
      return;
  }

  albums.forEach(album => {
      const albumElement = document.createElement('div');
      albumElement.classList.add('album');

      albumElement.innerHTML = `
          <h3>${album.name}</h3>
          <p><strong>Release Date:</strong> ${album.release_date}</p>
          <img src="${album.images[0]?.url}" alt="${album.name}" width="100">
          <button class="add-btn" data-album-id="${album.id}">+</button>
      `;
      output.appendChild(albumElement);

      // Add event listener to "Add to List" buttons
      const addButton = albumElement.querySelector('.add-btn');
      addButton.addEventListener('click', function () {
          const albumId = this.getAttribute('data-album-id');
          const albumName = album.name;
          const albumReleaseDate = album.release_date;
          const albumImageUrl = album.images[0]?.url; // Get the image URL
          addAlbumToList(albumId, albumName, albumReleaseDate, albumImageUrl);
      });
  });
}

// Function to add album to the user's list
function addAlbumToList(albumId, albumName, albumReleaseDate, albumImageUrl) {
  // Get the user ID from localStorage
  const loggedInUser = localStorage.getItem("loggedInUser");
  if (!loggedInUser) {
      alert("You must be logged in to add albums to your list.");
      return; // Avoid further code execution if not logged in
  }

  // Retrieve the user's list from localStorage or create an empty array if it doesn't exist
  let userAlbums = JSON.parse(localStorage.getItem(`user_${loggedInUser}_albums`)) || [];

  // Check if album is already in the list
  if (!userAlbums.some(album => album.id === albumId)) {
      // Add the album to the list with all relevant data
      userAlbums.push({
          id: albumId,
          name: albumName,
          release_date: albumReleaseDate,
          image: albumImageUrl
      });
      localStorage.setItem(`user_${loggedInUser}_albums`, JSON.stringify(userAlbums));
  } else {
      alert("This album is already in your list.");
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