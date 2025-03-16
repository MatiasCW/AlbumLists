// Import Firebase instances from firebase.js
import { auth, db } from "https://matiascw.github.io/AlbumLists/docs/script/firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const userDisplay = document.getElementById("userDisplay");
    const authButtons = document.getElementById("authButtons");

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const loggedInUser = user.displayName || user.email;
            const userEmail = user.email;

            if (userDisplay && authButtons) {
                userDisplay.innerHTML = `<span>${loggedInUser} (${userEmail})</span>`;
                authButtons.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;

                // Fetch from albums subcollection
                displaySelectedAlbums(user.uid);

                const logoutButton = document.getElementById("logoutBtn");
                if (logoutButton) {
                    logoutButton.addEventListener("click", async (event) => {
                        event.preventDefault();
                        await signOut(auth);
                        window.location.href = "index.html";
                    });
                }
            }
        } else {
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

// Firestore-optimized album handling
async function displaySelectedAlbums(userId) {
    const albumTableBody = document.querySelector(".album-table tbody");
    const scoreHeader = document.querySelector(".album-table th:nth-child(4)");

    if (!albumTableBody || !scoreHeader) return;

    try {
        const albumsRef = collection(db, 'users', userId, 'albums');
        let querySnapshot = await getDocs(albumsRef);
        
        let albums = [];
        querySnapshot.forEach(doc => {
            albums.push({ id: doc.id, ...doc.data() });
        });

        const renderTable = (sortedAlbums) => {
            albumTableBody.innerHTML = sortedAlbums.map((album, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td><img src="${album.image}" alt="${album.name}" width="100"></td>
                    <td>${album.name}</td>
                    <td>
                        <select class="score-dropdown" data-album-id="${album.id}" value="${album.score || '-'}">
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

            // Add event listeners
            document.querySelectorAll('.score-dropdown').forEach(dropdown => {
                dropdown.addEventListener('change', async (e) => {
                    const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
                    await updateDoc(albumRef, { score: e.target.value });
                });
            });

            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm("Are you sure?")) {
                        const albumRef = doc(db, 'users', userId, 'albums', e.target.dataset.albumId);
                        await deleteDoc(albumRef);
                        e.target.closest('tr').remove();
                    }
                });
            });
        };

        scoreHeader.addEventListener('click', () => {
            const sortKey = scoreHeader.dataset.sort || 'desc';
            const sorted = [...albums].sort((a, b) => 
                sortKey === 'asc' ? (a.score || 0) - (b.score || 0) : (b.score || 0) - (a.score || 0)
            );
            scoreHeader.dataset.sort = sortKey === 'asc' ? 'desc' : 'asc';
            renderTable(sorted);
        });

        renderTable(albums);
    } catch (error) {
        console.error("Error loading albums:", error);
        albumTableBody.innerHTML = `<tr><td colspan="6">Error loading albums</td></tr>`;
    }
}