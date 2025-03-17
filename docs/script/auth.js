import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    if (!userDisplay || !authButtons) {
        console.error("Required elements (userDisplay or authButtons) not found!");
        return;
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const loggedInUser = user.displayName; // Only use displayName (username)
            userDisplay.innerHTML = `<span>${loggedInUser}</span>`; // Display only the username
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