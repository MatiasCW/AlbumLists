// Import Firebase modules from your firebase.js file
import { auth } from "./firebase.js"; // Import initialized Firebase auth instance
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const emailInput = document.getElementById("loginUsername");
            const passwordInput = document.getElementById("password");

            if (emailInput && passwordInput) {
                const email = emailInput.value;
                const password = passwordInput.value;

                if (email && password) {
                    try {
                        // Sign in with Firebase Authentication
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        
                        // Redirect to homepage after successful login
                        window.location.href = "index.html";

                    } catch (error) {
                        // Handle errors
                        let errorMessage = "Login failed. Please try again.";
                        switch (error.code) {
                            case "auth/invalid-email":
                                errorMessage = "Invalid email format";
                                break;
                            case "auth/user-disabled":
                                errorMessage = "Account disabled";
                                break;
                            case "auth/user-not-found":
                            case "auth/wrong-password":
                                errorMessage = "Invalid email or password";
                                break;
                            default:
                                errorMessage = error.message; // Show the default error message
                        }
                        alert(errorMessage);
                        console.error("Login error:", error);
                    }
                } else {
                    alert("Please enter both email and password.");
                }
            } else {
                console.error("Email or password input not found!");
            }
        });
    } else {
        console.error("Login form not found!");
    }
});