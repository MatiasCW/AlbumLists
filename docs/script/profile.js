import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Default profile picture
const DEFAULT_PFP = "media/default.jpg";

// Get the UID from the query parameter
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');
console.log("UID from URL:", uid);

// Elements
const usernameElement = document.querySelector('.username');
const profileImage = document.getElementById('profile-image');
const backgroundContainer = document.getElementById('background-container');
const pfpModal = document.getElementById('pfp-modal');
const bgModal = document.getElementById('bg-modal');
const pfpOptions = document.getElementById('pfp-options');
const bgOptions = document.getElementById('bg-options');
const changePfpBtn = document.getElementById('change-pfp-btn');
const changeBgBtn = document.getElementById('change-bg-btn');
const listBtn = document.getElementById('list-btn');

// Set default pfp if the specified one fails to load
profileImage.onerror = () => {
    profileImage.src = DEFAULT_PFP;
};

// Load user data
const loadUserData = async () => {
    if (!uid) {
        alert("User ID not found.");
        window.location.href = "index.html";
        return;
    }

    try {
        console.log("Fetching user data for UID:", uid);

        // Fetch user document from Firestore
        const userDoc = await getDoc(doc(db, 'users', uid));
        console.log("User Document:", userDoc.data());

        if (userDoc.exists()) {
            const { username, profilePicture, backgroundImage } = userDoc.data();

            // Display username
            usernameElement.textContent = username || "Unknown User";

            // Set profile picture with fallback to default
            profileImage.src = profilePicture || DEFAULT_PFP;

            // Set background image (unchanged from your original code)
            backgroundContainer.style.backgroundImage = `url('${backgroundImage || "https://via.placeholder.com/1920x1080"}')`;

            // Set the List button's href to the user's list page
            if (listBtn) {
                listBtn.onclick = () => {
                    window.location.href = `list.html?uid=${uid}`;
                };
            }

            // Enable profile editing only for the current user
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.uid === uid) {
                // Show edit buttons for profile picture and background
                changePfpBtn.style.display = "block";
                changeBgBtn.style.display = "block";
            } else {
                // Hide edit buttons for other users
                changePfpBtn.style.display = "none";
                changeBgBtn.style.display = "none";
            }
        } else {
            alert("User not found.");
            window.location.href = "index.html";
        }
    } catch (error) {
        console.error("Error loading user data:", error);
        alert("Error loading user data. Please try again.");
    }
};

// Open profile picture modal
changePfpBtn.addEventListener('click', () => {
    pfpModal.style.display = "block";
    loadPfpOptions();
});

// Open background modal
changeBgBtn.addEventListener('click', () => {
    bgModal.style.display = "block";
    loadBgOptions();
});

// Close modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        pfpModal.style.display = "none";
        bgModal.style.display = "none";
    });
});

// Load profile picture options
const loadPfpOptions = () => {
    pfpOptions.innerHTML = profilePictures
        .map((pfp, index) => `
            <div class="image-option" data-pfp="${pfp}">
                <img src="${pfp}" alt="Profile Picture ${index + 1}">
            </div>
        `)
        .join('');

    document.querySelectorAll('#pfp-options .image-option').forEach(option => {
        option.addEventListener('click', async () => {
            const selectedPfp = option.getAttribute('data-pfp');
            profileImage.src = selectedPfp;
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { profilePicture: selectedPfp });
            pfpModal.style.display = "none";
        });
    });
};

// Load background options
const loadBgOptions = () => {
    bgOptions.innerHTML = backgrounds
        .map((bg, index) => `
            <div class="image-option" data-bg="${bg}">
                <img src="${bg}" alt="Background ${index + 1}">
            </div>
        `)
        .join('');

    document.querySelectorAll('#bg-options .image-option').forEach(option => {
        option.addEventListener('click', async () => {
            const selectedBg = option.getAttribute('data-bg');
            backgroundContainer.style.backgroundImage = `url('${selectedBg}')`;
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { backgroundImage: selectedBg });
            bgModal.style.display = "none";
        });
    });
};

// Initialize page
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadUserData();
    }
});