document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");

    if (loginForm) { // Check if the form exists
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent form submission

            // Get the username and password entered by the user
            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");

            if (usernameInput && passwordInput) { // Check if inputs exist
                const username = usernameInput.value;
                const password = passwordInput.value;

                // Perform simple validation
                if (username && password) {
                    // Store login status and user information in localStorage
                    localStorage.setItem("loggedIn", "true"); // Mark user as logged in
                    localStorage.setItem("loggedInUser", username); // Store the username

                    // Redirect to the homepage or dashboard after successful login
                    window.location.href = "index.html"; // Replace with the URL of your homepage or dashboard
                } else {
                    // If validation fails, show an alert
                    alert("Please enter both username and password.");
                }
            } else {
                console.error("Username or password input not found!"); // Debugging
            }
        });
    } else {
        console.error("Login form not found!"); // Debugging
    }
});