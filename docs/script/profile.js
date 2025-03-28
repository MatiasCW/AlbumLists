import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Local default images
const DEFAULT_PFP = "media/default.jpg";
const DEFAULT_BG = "media/bg/default.jpg";

// Get UID from URL
const urlParams = new URLSearchParams(window.location.search);
const uid = urlParams.get('uid');

// DOM elements
const profileElements = {
    username: document.querySelector('.username'),
    profileImage: document.getElementById('profile-image'),
    backgroundContainer: document.getElementById('background-container'),
    changePfpBtn: document.getElementById('change-pfp-btn'),
    changeBgBtn: document.getElementById('change-bg-btn'),
    listBtn: document.getElementById('list-btn')
};

// Image options
const profilePictures = Array.from({ length: 23 }, (_, i) => `media/pfp/pfp${i + 1}.jpg`);
const backgrounds = Array.from({ length: 12 }, (_, i) => `media/bg/bg${i + 1}.jpg`);

// Set image error handlers
profileElements.profileImage.onerror = () => {
    profileElements.profileImage.src = DEFAULT_PFP;
};

// Load user data
const loadUserData = async () => {
    if (!uid) {
        alert("No user specified");
        return window.location.href = "index.html";
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        
        if (!userDoc.exists()) {
            alert("User not found");
            return window.location.href = "index.html";
        }

        const userData = userDoc.data();
        
        // Update UI
        profileElements.username.textContent = userData.username || "User";
        profileElements.profileImage.src = userData.profilePicture || DEFAULT_PFP;
        profileElements.backgroundContainer.style.backgroundImage = 
            `url('${userData.backgroundImage || DEFAULT_BG}')`;

        // Setup list button
        if (profileElements.listBtn) {
            profileElements.listBtn.onclick = () => {
                window.location.href = `list.html?uid=${uid}`;
            };
        }

        // Show edit buttons only for current user
        const currentUser = auth.currentUser;
        const isCurrentUser = currentUser && currentUser.uid === uid;
        profileElements.changePfpBtn.style.display = isCurrentUser ? "block" : "none";
        profileElements.changeBgBtn.style.display = isCurrentUser ? "block" : "none";

    } catch (error) {
        console.error("Profile load error:", error);
        alert("Error loading profile");
    }
};

// Initialize
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        loadUserData();
    }
});