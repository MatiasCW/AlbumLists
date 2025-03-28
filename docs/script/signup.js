// Import Firebase instances from firebase.js
import { auth, db } from "./firebase.js";

// Import Firebase Authentication and Firestore functions
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to check if a username is unique
async function checkUsernameUnique(username) {
    const usernameLower = username.toLowerCase();
    const docRef = doc(db, 'usernames', usernameLower);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists(); // Returns true if username is unique
}

// Function to create a user profile
async function createUserProfile(user, username, email) {
    const usernameLower = username.toLowerCase();
    
    // Check username uniqueness
    if (!(await checkUsernameUnique(username))) {
        throw new Error('Username already exists');
    }

    // Create user document in the 'users' collection
    await setDoc(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        profilePicture: "https://via.placeholder.com/150", // Default profile picture
        backgroundImage: "https://via.placeholder.com/1920x1080" // Default background image
    });

    // Create username reference in the 'usernames' collection
    await setDoc(doc(db, 'usernames', usernameLower), {
        userId: user.uid,
        username: usernameLower
    };
}

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

                    // Create user profile in Firestore
                    await createUserProfile(userCredential.user, username, email);

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
                        case "Username already exists": // Custom error for username uniqueness
                            errorMessage = "Username is already taken.";
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