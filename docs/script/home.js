import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { listenToTop100Albums } from './firebase.js';

function createUserCard(userData, userId) {
    return `
        <div class="profile-image-container">
            <img src="${userData.profilePicture || 'media/default.jpg'}" 
                 alt="${userData.username}'s profile" 
                 class="user-pfp"
                 onerror="this.src='media/default.jpg'">
        </div>
        <div class="user-username">${userData.username || 'Anonymous'}</div>
    `;
}

function createAlbumCard(album) {
    return `
        <div class="profile-image-container">
            <img src="${album.image || 'media/default-album.jpg'}" 
                 alt="${album.name}" 
                 class="user-pfp"
                 onerror="this.src='media/default-album.jpg'">
        </div>
        <div class="user-username">${album.name}</div>
        <div class="average-score">⭐ ${album.averageScore || '0.0'}</div>
    `;
}

async function loadAllUsers() {
    const usersContainer = document.getElementById('usersContainer');
    
    try {
        usersContainer.innerHTML = '<p>Loading users...</p>';
        const querySnapshot = await getDocs(collection(db, 'users'));
        
        if (querySnapshot.empty) {
            usersContainer.innerHTML = '<p>No users found.</p>';
            return;
        }

        // Convert to array and shuffle
        const allUsers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
        }));

        // Shuffle function
        const shuffleUsers = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        };

        const shuffledUsers = shuffleUsers(allUsers).slice(0, 20);

        usersContainer.innerHTML = '';
        shuffledUsers.forEach((user) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = createUserCard(user.data, user.id);
            userCard.addEventListener('click', () => {
                window.location.href = `profile.html?uid=${user.id}`;
            });
            usersContainer.appendChild(userCard);
        });

    } catch (error) {
        console.error("Error loading users:", error);
        usersContainer.innerHTML = '<p class="error">Error loading users. Please try again later.</p>';
    }
}

async function loadTopAlbums() {
    const albumsContainer = document.getElementById('topAlbumsContainer');
    
    try {
        albumsContainer.innerHTML = '<p>Loading top albums...</p>';
        
        const unsubscribe = listenToTop100Albums((albums) => {
            const top20 = albums.slice(0, 20);
            albumsContainer.innerHTML = '';
            
            top20.forEach((album) => {
                const albumCard = document.createElement('div');
                albumCard.className = 'user-card';
                albumCard.innerHTML = createAlbumCard(album);
                albumCard.addEventListener('click', () => {
                    // You can add navigation to album details if needed
                    // window.location.href = `album.html?id=${album.id}`;
                });
                albumsContainer.appendChild(albumCard);
            });
        });

        window.addEventListener('beforeunload', unsubscribe);

    } catch (error) {
        console.error("Error loading albums:", error);
        albumsContainer.innerHTML = '<p class="error">Error loading top albums.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadAllUsers();
    loadTopAlbums();
});