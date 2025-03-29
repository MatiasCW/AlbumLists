import { db } from "./firebase.js";
import { collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { listenToTop100Albums } from './firebase.js';

// Utility function to shuffle array
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

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
    const score = typeof album.averageScore === 'number' 
        ? album.averageScore.toFixed(1) 
        : '0.0';
    
    return `
        <div class="profile-image-container">
            <img src="${album.image || 'media/default-album.jpg'}" 
                 alt="${album.name}" 
                 class="user-pfp"
                 onerror="this.src='media/default-album.jpg'">
        </div>
        <div class="user-username">${album.name || 'Unknown Album'}</div>
        <div class="average-score">⭐ ${score}</div>
    `;
}

async function loadRandomUsers() {
    const usersContainer = document.getElementById('usersContainer');
    
    try {
        usersContainer.innerHTML = '<p>Loading users...</p>';
        const querySnapshot = await getDocs(collection(db, 'users'));
        
        if (querySnapshot.empty) {
            usersContainer.innerHTML = '<p>No users found.</p>';
            return;
        }

        // Get all users, shuffle, and take first 20
        const allUsers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        const shuffledUsers = shuffleArray(allUsers);
        const randomUsers = shuffledUsers.slice(0, 20);

        usersContainer.innerHTML = '';
        randomUsers.forEach((user) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = createUserCard(user, user.id);
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
            if (!albums || albums.length === 0) {
                albumsContainer.innerHTML = '<p>No albums found.</p>';
                return;
            }

            const top20 = albums.slice(0, 20);
            albumsContainer.innerHTML = '';
            
            top20.forEach((album) => {
                if (!album) return; // Skip null/undefined albums
                
                const albumCard = document.createElement('div');
                albumCard.className = 'user-card';
                albumCard.innerHTML = createAlbumCard(album);
                albumCard.addEventListener('click', () => {
                    // Optional: Add navigation to album details
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
    loadRandomUsers(); 
    loadTopAlbums();
});