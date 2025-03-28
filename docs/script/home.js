import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

function createUserCard(userData, userId) {
    return `
    <div class="user-card">
        <div class="profile-image-container">
            <img src="${userData.profilePicture || 'media/default.jpg'}" 
                 alt="${userData.username}'s profile" 
                 onerror="this.src='media/default.jpg'">
        </div>
        <div class="user-username">${userData.username || 'Anonymous'}</div>
    </div>
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

        usersContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = createUserCard(doc.data(), doc.id);
            userCard.addEventListener('click', () => {
                window.location.href = `profile.html?uid=${doc.id}`;
            });
            usersContainer.appendChild(userCard);
        });

    } catch (error) {
        console.error("Error loading users:", error);
        usersContainer.innerHTML = '<p class="error">Error loading users. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadAllUsers);