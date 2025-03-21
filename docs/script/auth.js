import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    // Check if the required elements exist
    if (!userDisplay || !authButtons) {
        console.error("Required elements (userDisplay or authButtons) not found!");
        return;
    }

    // Set up the authentication state listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            const loggedInUser = user.displayName || user.email;
    
            // Display username in the navbar and make it clickable
            userDisplay.innerHTML = `<a href="profile.html?uid=${user.uid}" id="usernameLink">${loggedInUser}</a>`;
            
            // Update the auth buttons to show the Logout option
            authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;
    
            // Logout handler
            document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    window.location.href = "index.html"; // Redirect to login page
                } catch (error) {
                    alert("Error signing out: " + error.message);
                }
            });
        } else {
            // User is signed out
            userDisplay.innerHTML = '';
            authButtons.innerHTML = `
                <a href="signup.html">Sign Up</a>
                <a href="login.html">Login</a>
            `;
        }
    });
});
