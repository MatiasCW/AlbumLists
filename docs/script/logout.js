// Import Firebase modules from your firebase.js file
import { auth, db } from "./firebase.js";
import { signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutBtn');

    if (logoutButton) {
        logoutButton.addEventListener('click', async function(event) {
            event.preventDefault();
            
            try {
                // Sign out the user
                await signOut(auth);
                
                // Redirect to the login page after successful logout
                window.location.href = 'login.html';
            } catch (error) {
                // Handle errors
                console.error('Sign out error:', error);
                alert('Error signing out: ' + error.message);
            }
        });
    } else {
        console.error('Logout button not found!');
    }
});