// Import Firebase modules from your firebase.js file
import { auth, db } from "../firebase.js"; // Adjust the path if necessary
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            // Get form values
            const username = document.getElementById("signupUsername").value;
            const email = document.getElementById("signupEmail").value;
            const password = document.getElementById("signupPassword").value;

            if (username && email && password) {
                try {
                    // Create user with Firebase Authentication
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    // Update user profile with username
                    await updateProfile(userCredential.user, {
                        displayName: username
                    });

                    // Store additional user data in Firestore
                    const userRef = doc(db, "users", userCredential.user.uid);
                    await setDoc(userRef, {
                        username: username,
                        email: email,
                        createdAt: serverTimestamp()
                    });

                    // Redirect to homepage after successful signup
                    window.location.href = "index.html";

                } catch (error) {
                    // Handle errors
                    let errorMessage = "Signup failed. Please try again.";
                    switch (error.code) {
                        case "auth/email-already-in-use":
                            errorMessage = "Email is already registered.";
                            break;
                        case "auth/invalid-email":
                            errorMessage = "Invalid email address.";
                            break;
                        case "auth/weak-password":
                            errorMessage = "Password should be at least 6 characters.";
                            break;
                        default:
                            errorMessage = error.message; // Show the default error message
                    }
                    alert(errorMessage);
                    console.error("Signup error:", error);
                }
            } else {
                alert("Please fill all fields (Username, Email, and Password).");
            }
        });
    } else {
        console.error("Signup form not found!");
    }
});