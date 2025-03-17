import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    if (!userDisplay || !authButtons) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            const loggedInUser = user.displayName;
            userDisplay.innerHTML = `<span>${loggedInUser}</span>`;
            authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;

            // Logout handler
            document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    await signOut(auth);
                    window.location.href = "login.html"; // ✅ Redirect to login page
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