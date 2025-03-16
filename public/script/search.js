document.addEventListener('DOMContentLoaded', function () {
    // Example albums array (replace this with your actual album fetch logic)
    const albums = [
        { id: 'album1', name: 'Album 1', release_date: '2022-01-01', images: [{ url: 'https://via.placeholder.com/100' }] },
        { id: 'album2', name: 'Album 2', release_date: '2022-05-01', images: [{ url: 'https://via.placeholder.com/100' }] }
    ];

    // Use the displayAlbums function from fetch.js
    displayAlbums(albums);
});