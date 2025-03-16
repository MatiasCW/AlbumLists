document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");

    if (signupForm) {
        signupForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent form submission

            // Get the username and password entered by the user
            const username = document.getElementById("signupUsername").value;
            const password = document.getElementById("signupPassword").value;

            // Perform simple validation
            if (username && password) {
                // Store the new user in localStorage
                localStorage.setItem("loggedInUser", username);

                // Redirect to the homepage after successful signup
                window.location.href = "index.html";
            } else {
                alert("Please enter both username and password.");
            }
        });
    } else {
        console.error("Signup form not found!"); // Debugging
    }
});