import { getTop100Albums } from './firebase.js'; // Import function from firebase.js

// Function to display the top albums in the HTML
const displayTopAlbums = async () => {
  const topAlbumsDiv = document.getElementById("top-albums");
  const top100Albums = await getTop100Albums(); // Fetch the top 100 albums from Firebase

  // Clear any existing content before displaying the new list
  topAlbumsDiv.innerHTML = "<h2>Top 100 Albums</h2>";

  if (top100Albums.length === 0) {
    topAlbumsDiv.innerHTML += "<p>No albums found.</p>";
    return;
  }

  const albumList = document.createElement("ul");

  // Loop through the top 100 albums and display them
  top100Albums.forEach((album, index) => {
    const listItem = document.createElement("li");

    listItem.innerHTML = `
      <strong>${index + 1}. ${album.title}</strong> by ${album.artist}
      <br>Average Rating: ${album.averageRating.toFixed(2)}
    `;

    albumList.appendChild(listItem); // Append each album to the list
  });

  // Append the album list to the 'top-albums' div
  topAlbumsDiv.appendChild(albumList);
};

// Call the function to display the albums when the page loads
document.addEventListener('DOMContentLoaded', () => {
  displayTopAlbums();
});
