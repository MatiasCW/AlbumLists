// Import Firebase instances from firebase.js
import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Function to check if a username is unique
async function checkUsernameUnique(username) {
    const usernameLower = username.toLowerCase();
    const docRef = doc(db, 'usernames', usernameLower);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
}

// Function to create a user profile
async function createUserProfile(user, username, email) {
    const usernameLower = username.toLowerCase();
    
    if (!(await checkUsernameUnique(username))) {
        throw new Error('Username already exists');
    }

    // Use batch write for atomic operations
    const batch = writeBatch(db);
    
    // Create user document
    batch.set(doc(db, 'users', user.uid), {
        username: username,
        email: email,
        createdAt: serverTimestamp(),
        profilePicture: "media/default.jpg",  // Local default image
        backgroundImage: "media/bg/default.jpg"  // Local default background
    });

    // Create username reference
    batch.set(doc(db, 'usernames', usernameLower), {
        userId: user.uid,
        username: usernameLower
    });

    await batch.commit();
}

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const username = document.getElementById("signupUsername").value.trim();
            const email = document.getElementById("signupEmail").value.trim();
            const password = document.getElementById("signupPassword").value;

            if (username && email && password) {
                try {
                    // Create auth user
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    // Update auth profile
                    await updateProfile(userCredential.user, {
                        displayName: username
                    });

                    // Create Firestore records
                    await createUserProfile(userCredential.user, username, email);

                    // Redirect with success
                    window.location.href = `profile.html?uid=${userCredential.user.uid}`;

                } catch (error) {
                    let errorMessage = "Signup failed. Please try again.";
                    switch (error.code || error.message) {
                        case "auth/email-already-in-use":
                            errorMessage = "Email is already registered.";
                            break;
                        case "auth/invalid-email":
                            errorMessage = "Invalid email address.";
                            break;
                        case "auth/weak-password":
                            errorMessage = "Password should be at least 6 characters.";
                            break;
                        case "Username already exists":
                            errorMessage = "Username is already taken.";
                            break;
                        default:
                            errorMessage = error.message;
                    }
                    alert(errorMessage);
                    console.error("Signup error:", error);
                }
            } else {
                alert("Please fill all fields.");
            }
        });
    }
});