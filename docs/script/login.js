document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            if (emailInput && passwordInput) {
                const email = emailInput.value;
                const password = passwordInput.value;

                if (email && password) {
                    firebase.auth().signInWithEmailAndPassword(email, password)
                        .then((userCredential) => {
                            window.location.href = "index.html";
                        })
                        .catch((error) => {
                            let errorMessage = "Login failed. Please try again.";
                            
                            // More specific error handling
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
                            }
                            
                            alert(errorMessage);
                            console.error("Login error:", error);
                        });
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