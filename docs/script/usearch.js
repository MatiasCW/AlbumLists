import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('userSearch');
    
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const username = e.target.value.trim();
            if (!username) return;

            try {
                // Convert to lowercase for document ID lookup
                const lowercaseUsername = username.toLowerCase();
                console.log("Searching for username:", lowercaseUsername);

                // Get document directly by ID from usernames collection
                const docRef = doc(db, 'usernames', lowercaseUsername);
                const docSnap = await getDoc(docRef);

                console.log("Query Result:", docSnap);

                if (!docSnap.exists()) {
                    alert('User not found');
                    return;
                }

                // Get the userId from the document
                const userId = docSnap.data().userId;
                console.log("User ID found:", userId);

                // Redirect to profile
                window.location.href = `profile.html?uid=${userId}`;
            } catch (error) {
                console.error('Error searching user:', error);
                alert('Error searching for user');
            }
        }
    });
});