document.addEventListener("DOMContentLoaded", () => {
    const loggedInUser = localStorage.getItem("loggedInUser");

    // Display username if logged in
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    // Check if the elements exist before manipulating them
    if (userDisplay && authButtons) {
        if (loggedInUser) {
            // Display user's name and switch to logout
            userDisplay.innerHTML = `<span>${loggedInUser}</span>`;
            authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;

            // Fetch and display selected albums for the logged-in user
            displaySelectedAlbums(loggedInUser);

            // Logout functionality
            const logoutButton = document.getElementById("logoutBtn");
            if (logoutButton) {
                logoutButton.addEventListener("click", (event) => {
                    event.preventDefault(); // Prevent default link behavior

                    // Clear user info from localStorage
                    localStorage.removeItem("loggedInUser");

                    // Clear username and show login/signup buttons
                    userDisplay.innerHTML = '';
                    authButtons.innerHTML = `
                        <a href="signup.html">Sign Up</a>
                        <a href="login.html">Login</a>
                    `;

                    // Redirect to the homepage after logout
                    window.location.href = "index.html";
                });
            } else {
                console.error("Logout button not found!"); // Debugging
            }
        } else {
            // Clear user info and show login/signup buttons
            userDisplay.innerHTML = '';
            authButtons.innerHTML = `
                <a href="signup.html">Sign Up</a>
                <a href="login.html">Login</a>
            `;
        }
    } else {
        console.error("Auth elements (userDisplay or authButtons) not found!"); // Debugging
    }
});

// Function to display selected albums in a table
function displaySelectedAlbums(user) {
    const albumTableBody = document.querySelector(".album-table tbody");
    const scoreHeader = document.querySelector(".album-table th:nth-child(4)"); // Score header (4th column)

    if (albumTableBody && scoreHeader) {
        // Check if there are selected albums for the logged-in user (stored in localStorage)
        let albums = JSON.parse(localStorage.getItem(`user_${user}_albums`)) || [];

        // Variable to track the current sorting state
        let sortState = "default"; // Can be "default", "asc", or "desc"

        // Function to sort albums based on the current sort state
        const sortAlbums = () => {
            if (sortState === "asc") {
                // Sort by score in ascending order
                albums.sort((a, b) => {
                    const scoreA = a.score || 0; // Default to 0 if no score
                    const scoreB = b.score || 0;
                    return scoreA - scoreB;
                });
            } else if (sortState === "desc") {
                // Sort by score in descending order
                albums.sort((a, b) => {
                    const scoreA = a.score || 0;
                    const scoreB = b.score || 0;
                    return scoreB - scoreA;
                });
            } else {
                // Default sorting (original order)
                albums = JSON.parse(localStorage.getItem(`user_${user}_albums`)) || [];
            }
        };

        // Function to render the table rows
        const renderTable = () => {
            // Clear any existing rows
            albumTableBody.innerHTML = '';

            // Display albums dynamically as table rows
            albums.forEach((album, index) => {
                const row = document.createElement("tr");

                // Rank (Position in the list)
                const rankCell = document.createElement("td");
                rankCell.textContent = index + 1; // Rank starts from 1
                row.appendChild(rankCell);

                // Album Cover (Image)
                const coverCell = document.createElement("td");
                coverCell.innerHTML = `<img src="${album.image}" alt="${album.name}" width="100">`;
                row.appendChild(coverCell);

                // Album Name
                const nameCell = document.createElement("td");
                nameCell.textContent = album.name;
                row.appendChild(nameCell);

                // Score Dropdown
                const scoreCell = document.createElement("td");
                const scoreDropdown = document.createElement("select");
                scoreDropdown.className = "score-dropdown";

                // Add options to the dropdown
                const options = ["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
                options.forEach((option) => {
                    const optionElement = document.createElement("option");
                    optionElement.value = option;
                    optionElement.textContent = option;
                    scoreDropdown.appendChild(optionElement);
                });

                // Set the selected value if a score exists for this album
                if (album.score) {
                    scoreDropdown.value = album.score;
                }

                // Add event listener to save the score when changed
                scoreDropdown.addEventListener("change", (event) => {
                    const selectedScore = event.target.value;
                    album.score = selectedScore; // Update the album object
                    localStorage.setItem(`user_${user}_albums`, JSON.stringify(albums)); // Save to localStorage
                });

                scoreCell.appendChild(scoreDropdown);
                row.appendChild(scoreCell);

                // Release Date
                const dateCell = document.createElement("td");
                dateCell.textContent = album.release_date;
                row.appendChild(dateCell);

                // Remove Button
                const removeCell = document.createElement("td");
                const removeButton = document.createElement("button");
                removeButton.textContent = "-";
                removeButton.className = "remove-btn";
                removeButton.addEventListener("click", () => {
                    // Show confirmation alert
                    const confirmRemove = confirm("Are you sure you want to remove this album?");
                    if (confirmRemove) {
                        // Remove the album from the list
                        albums.splice(index, 1); // Remove 1 item at the current index
                        localStorage.setItem(`user_${user}_albums`, JSON.stringify(albums)); // Update localStorage
                        renderTable(); // Re-render the table
                    }
                });
                removeCell.appendChild(removeButton);
                row.appendChild(removeCell);

                // Add the row to the table
                albumTableBody.appendChild(row);
            });
        };

        // Add event listener to the Score header for sorting
        scoreHeader.addEventListener("click", () => {
            // Cycle through sorting states: default -> asc -> desc -> default
            if (sortState === "default") {
                sortState = "asc";
            } else if (sortState === "asc") {
                sortState = "desc";
            } else {
                sortState = "default";
            }

            // Sort the albums and re-render the table
            sortAlbums();
            renderTable();
        });

        // Initial render of the table
        renderTable();
    } else {
        console.error("Album table body or score header not found!"); // Debugging
    }
}

