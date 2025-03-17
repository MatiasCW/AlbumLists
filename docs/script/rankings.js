import { getTop100Albums } from './firebase.js';

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
                <strong>${index + 1}. Album ID: ${album.id}</strong>
                <br>Average Score: ${album.averageScore.toFixed(2)}
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