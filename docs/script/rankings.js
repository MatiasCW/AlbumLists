import { listenToTop100Albums } from './firebase.js';

// Function to display the top albums in the HTML
const displayTopAlbums = (albums) => {
  const topAlbumsDiv = document.getElementById('top-albums');
  if (!topAlbumsDiv) return;

  console.log(`Fetched ${albums.length} albums`); // Debugging log

  // Clear any existing content before displaying the new list
  topAlbumsDiv.innerHTML = '<h2>Top 100 Albums</h2>';

  if (albums.length === 0) {
    topAlbumsDiv.innerHTML += '<p>No albums found.</p>';
    return;
  }

  const albumList = document.createElement('ul');

  // Loop through the top 100 albums and display them
  albums.forEach((album, index) => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      <div class="album-item">
        <img src="${album.image}" alt="${album.name}" width="100"> <!-- Display album cover -->
        <div class="album-details">
          <strong>${index + 1}. ${album.name}</strong> <!-- Display album name -->
          <br>Average Score: ${album.averageScore}
        </div>
      </div>
    `;
    albumList.appendChild(listItem); // Append each album to the list
  });

  // Append the album list to the 'top-albums' div
  topAlbumsDiv.appendChild(albumList);
};

// Call the function to display the albums when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Set up real-time listener for top 100 albums
  const unsubscribe = listenToTop100Albums((albums) => {
    displayTopAlbums(albums);
  });

  // Clean up the listener when the page is unloaded
  window.addEventListener('beforeunload', unsubscribe);
});