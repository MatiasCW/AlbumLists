// Import Firebase instances from firebase.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Handle authentication state changes
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded"); // Debugging

    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    if (!userDisplay || !authButtons) {
        console.error("Required elements (userDisplay or authButtons) not found!");
        return;
    }

    onAuthStateChanged(auth, async (user) => {
        console.log("Auth state changed. User:", user); // Debugging

        if (user) {
            // User is signed in
            const loggedInUser = user.displayName || user.email;
            const userEmail = user.email;

            console.log("User is signed in:", loggedInUser, userEmail); // Debugging

            userDisplay.innerHTML = `<span>${loggedInUser} (${userEmail})</span>`;
            authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;

            // Fetch and display albums for the logged-in user
            try {
                await displaySelectedAlbums(user.uid);
            } catch (error) {
                console.error("Error fetching albums:", error);
                userDisplay.innerHTML += `<p style="color: red;">Error loading albums. Please try again.</p>`;
            }

            // Add logout event listener
            const logoutButton = document.getElementById("logoutBtn");
            if (logoutButton) {
                logoutButton.addEventListener("click", async (event) => {
                    event.preventDefault();
                    try {
                        await signOut(auth);
                        window.location.href = "index.html"; // Redirect to home page after logout
                    } catch (error) {
                        console.error("Logout error:", error);
                        alert("Error signing out. Please try again.");
                    }
                });
            }
        } else {
            // User is signed out
            console.log("User is signed out"); // Debugging
            userDisplay.innerHTML = '';
            authButtons.innerHTML = `
                <a href="signup.html">Sign Up</a>
                <a href="login.html">Login</a>
            `;
        }
    });
});

// Fetch and display albums from Firestore
async function displaySelectedAlbums(userId) {
    const albumTableBody = document.querySelector(".album-table tbody");
    const scoreHeader = document.querySelector(".album-table th:nth-child(4)");

    if (!albumTableBody || !scoreHeader) {
        console.error("Album table body or score header not found!");
        return;
    }

    try {
        const albumsRef = collection(db, 'users', userId, 'albums');
        const querySnapshot = await getDocs(albumsRef);
        
        const albums = [];
        querySnapshot.forEach(doc => {
            albums.push({ id: doc.id, ...doc.data() });
        });

        renderTable(albums);

        // Add event listeners for score dropdowns and remove buttons
        addEventListeners(userId);
    } catch (error) {
        console.error("Error loading albums:", error);
        albumTableBody.innerHTML = `<tr><td colspan="6">Error loading albums. Please try again.</td></tr>`;
    }
}

// Render the albums table
function renderTable(albums) {
    const albumTableBody = document.querySelector(".album-table tbody");
    if (!albumTableBody) return;

    albumTableBody.innerHTML = albums.map((album, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><img src="${album.image}" alt="${album.name}" width="100"></td>
            <td>${album.name}</td>
            <td>
                <select class="score-dropdown" data-album-id="${album.id}">
                    ${["-", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
                        .map(opt => `<option ${album.score === opt ? 'selected' : ''}>${opt}</option>`)
                        .join('')}
                </select>
            </td>
            <td>${album.release_date}</td>
            <td>
                <button class="remove-btn" data-album-id="${album.id}">-</button>
            </td>
        </tr>
    `).join('');
}

// Add event listeners for score dropdowns and remove buttons
function addEventListeners(userId) {
    const albumTableBody = document.querySelector(".album-table tbody");
    if (!albumTableBody) return;

    // Add event listeners for score dropdowns
    document.querySelectorAll('.score-dropdown').forEach(dropdown => {
        dropdown.addEventListener('change', async (e) => {
            const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
            try {
                await updateDoc(albumRef, { score: e.target.value });
            } catch (error) {
                console.error("Error updating album score:", error);
                alert("Error updating score. Please try again.");
            }
        });
    });

    // Add event listeners for remove buttons
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            if (confirm("Are you sure you want to remove this album?")) {
                const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
                try {
                    await deleteDoc(albumRef);
                    e.target.closest('tr').remove();
                } catch (error) {
                    console.error("Error removing album:", error);
                    alert("Error removing album. Please try again.");
                }
            }
        });
    });
}