document.addEventListener('DOMContentLoaded', function() {
    // Get the logout button
    const logoutButton = document.getElementById('logoutBtn');

    if (logoutButton) {
        // Add a click event listener to the logout button
        logoutButton.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default button behavior

            // Clear login status and user info from localStorage
            localStorage.removeItem('loggedInUser'); // Use the correct key
            localStorage.removeItem('loggedIn'); // Optional, if used elsewhere
            localStorage.removeItem('username'); // Optional, if used elsewhere

            // Redirect to the login page
            window.location.href = 'login.html'; // Change to your login page URL
        });
    } else {
        console.error('Logout button not found!'); // Debugging
    }
});