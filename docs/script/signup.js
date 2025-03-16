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
                    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                    
                    // Update user profile with username
                    await userCredential.user.updateProfile({
                        displayName: username
                    });

                    // Optional: Store additional user data in Firestore
                    await firebase.firestore().collection("users").doc(userCredential.user.uid).set({
                        username: username,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });

                    // Redirect to homepage
                    window.location.href = "index.html";

                } catch (error) {
                    // Handle errors
                    let errorMessage = "Signup failed. Please try again.";
                    switch(error.code) {
                        case "auth/email-already-in-use":
                            errorMessage = "Email is already registered";
                            break;
                        case "auth/invalid-email":
                            errorMessage = "Invalid email address";
                            break;
                        case "auth/weak-password":
                            errorMessage = "Password should be at least 6 characters";
                            break;
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