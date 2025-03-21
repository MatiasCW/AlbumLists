// Import Firebase modules from your firebase.js file
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const emailInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");

            if (emailInput && passwordInput) {
                const email = emailInput.value;
                const password = passwordInput.value;

                if (email && password) {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, email, password);
                        window.location.href = "index.html";
                    } catch (error) {
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
                                errorMessage = error.message;
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