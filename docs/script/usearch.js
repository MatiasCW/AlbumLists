import { auth, db } from "./firebase.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('userSearch');
    
    searchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const username = e.target.value.trim();
            if (!username) return;

            try {
                // Convert the search term to lowercase
                const lowercaseUsername = username.toLowerCase();

                // Search in the usernames collection
                const q = query(
                    collection(db, 'usernames'), 
                    where('username', '==', lowercaseUsername)
                );

                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) {
                    alert('User not found');
                    return;
                }

                // Get the userId from the query result
                const userId = querySnapshot.docs[0].data().userId;

                // Redirect to the user's profile page
                window.location.href = `profile.html?uid=${userId}`;
            } catch (error) {
                console.error('Error searching user:', error);
                alert('Error searching for user');
            }
        }
    });
});