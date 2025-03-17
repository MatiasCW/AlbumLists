import { db } from './firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to fetch the top 100 albums from the cached 'topAlbums' collection
export const getTop100Albums = async () => {
  try {
    // Fetch the top 100 albums from the 'topAlbums' collection
    const topAlbumsRef = collection(db, "topAlbums");
    const snapshot = await getDocs(topAlbumsRef);

    // Map the documents to an array of album data
    const top100Albums = snapshot.docs.map(doc => doc.data());

    // Sort the albums by rank (optional, but ensures correct order)
    top100Albums.sort((a, b) => a.rank - b.rank);

    console.log(`Fetched ${top100Albums.length} albums from cache`); // Debugging log
    return top100Albums;
  } catch (error) {
    console.error("Error fetching top albums from cache:", error);
    return [];
  }
};

// Function to display the top albums in the HTML
const displayTopAlbums = async () => {
  const topAlbumsDiv = document.getElementById('top-albums');
  if (!topAlbumsDiv) return;

  try {
    // Fetch the top 100 albums from Firebase
    const top100Albums = await getTop100Albums();

    console.log(`Fetched ${top100Albums.length} albums`); // Debugging log

    // Clear any existing content before displaying the new list
    topAlbumsDiv.innerHTML = '<h2>Top 100 Albums</h2>';

    if (top100Albums.length === 0) {
      topAlbumsDiv.innerHTML += '<p>No albums found.</p>';
      return;
    }

    const albumList = document.createElement('ul');

    // Loop through the top 100 albums and display them
    top100Albums.forEach((album, index) => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="album-item">
          <img src="${album.image}" alt="${album.name}" width="100"> <!-- Display album cover -->
          <div class="album-details">
            <strong>${index + 1}. ${album.name}</strong> <!-- Display album name -->
            <br>Average Score: ${album.averageScore.toFixed(2)}
          </div>
        </div>
      `;
      albumList.appendChild(listItem); // Append each album to the list
    });

    // Append the album list to the 'top-albums' div
    topAlbumsDiv.appendChild(albumList);
  } catch (error) {
    console.error('Error fetching top albums:', error);
    topAlbumsDiv.innerHTML = '<p style="color:red;">Error loading top albums.</p>';
  }
};

// Call the function to display the albums when the page loads
document.addEventListener('DOMContentLoaded', () => {
  displayTopAlbums();
});