import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to create user card HTML
function createUserCard(userData, userId) {
    return `
        <div class="user-card">
            <img src="${userData.profilePicture || 'media/default.jpg'}" 
                 alt="${userData.username}'s profile" 
                 class="user-pfp"
                 onerror="this.src='media/default.jpg'">
            <h3><a href="profile.html?uid=${userId}">${userData.username || 'Anonymous'}</a></h3>
        </div>
    `;
}

// Function to load all users from Firestore
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
            usersContainer.innerHTML += createUserCard(doc.data(), doc.id);
        });

    } catch (error) {
        console.error("Error loading users:", error);
        usersContainer.innerHTML = '<p class="error">Error loading users. Please try again later.</p>';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadAllUsers();
});