import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const auth = getAuth();
    const db = getFirestore();
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    // Listen for changes in the authentication state (login/logout)
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is logged in
            const loggedInUser = user.displayName || user.email;
            const userEmail = user.email;

            // Display username and email if logged in
            if (userDisplay && authButtons) {
                userDisplay.innerHTML = `<span>${loggedInUser} (${userEmail})</span>`;
                authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;

                // Fetch and display selected albums for the logged-in user
                displaySelectedAlbums(user.uid); // Pass user ID to fetch data

                // Logout functionality
                const logoutButton = document.getElementById("logoutBtn");
                if (logoutButton) {
                    logoutButton.addEventListener("click", async (event) => {
                        event.preventDefault(); // Prevent default link behavior

                        // Sign out the user from Firebase Authentication
                        await signOut(auth);

                        // Clear username and show login/signup buttons
                        userDisplay.innerHTML = '';
                        authButtons.innerHTML = `
                            <a href="signup.html">Sign Up</a>
                            <a href="login.html">Login</a>
                        `;

                        // Redirect to the homepage after logout
                        window.location.href = "index.html";
                    });
                }
            }
        } else {
            // No user is logged in
            if (userDisplay && authButtons) {
                userDisplay.innerHTML = '';
                authButtons.innerHTML = `
                    <a href="signup.html">Sign Up</a>
                    <a href="login.html">Login</a>
                `;
            }
        }
    });
});

// Function to display selected albums in a table
async function displaySelectedAlbums(userId) {
    const albumTableBody = document.querySelector(".album-table tbody");
    const scoreHeader = document.querySelector(".album-table th:nth-child(4)"); // Score header (4th column)

    if (albumTableBody && scoreHeader) {
        // Fetch albums from Firestore based on the userId
        const userAlbumsDocRef = doc(getFirestore(), "users", userId);
        const userAlbumsDoc = await getDoc(userAlbumsDocRef);
        let albums = userAlbumsDoc.exists() ? userAlbumsDoc.data().albums : [];

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
                albums = userAlbumsDoc.exists() ? userAlbumsDoc.data().albums : [];
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
                scoreDropdown.addEventListener("change", async (event) => {
                    const selectedScore = event.target.value;
                    album.score = selectedScore; // Update the album object

                    // Update Firestore with the new album data
                    await setDoc(userAlbumsDocRef, { albums }, { merge: true });

                    // Refresh the table after update
                    renderTable();
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
                removeButton.addEventListener("click", async () => {
                    // Show confirmation alert
                    const confirmRemove = confirm("Are you sure you want to remove this album?");
                    if (confirmRemove) {
                        // Remove the album from the list
                        albums.splice(index, 1); // Remove 1 item at the current index

                        // Update Firestore after removal
                        await setDoc(userAlbumsDocRef, { albums }, { merge: true });

                        // Re-render the table
                        renderTable();
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
