document.addEventListener("DOMContentLoaded", () => {
  // Check if the current page is list.html
  if (window.location.pathname.includes("list.html")) {
    // Get the logged-in user from Firebase Authentication
    const user = firebase.auth().currentUser;

    if (!user) {
      // Redirect to the login page if the user is not logged in
      alert("You need to log in to view your album list.");
      window.location.href = "login.html";
      return;
    }

    // Reference to the user's albums in Firebase
    const userAlbumsRef = firebase.database().ref(`users/${user.uid}/albums`);

    // Get the container where albums will be displayed
    const albumContainer = document.querySelector(".album-container");

    // Fetch the albums from Firebase
    userAlbumsRef.once("value", (snapshot) => {
      const userAlbums = snapshot.val() || [];

      if (Object.keys(userAlbums).length === 0) {
        // If no albums are saved, display a message
        albumContainer.innerHTML = "<p>No albums saved yet.</p>";
      } else {
        // Display each saved album with the same structure as albums.html
        albumContainer.innerHTML = Object.values(userAlbums)
          .map((album) => {
            return `
              <div class="album">
                <h3>${album.name}</h3>
                <p><strong>Release Date:</strong> ${album.release_date}</p>
                <img src="${album.image}" alt="${album.name}" width="100">
              </div>
            `;
          })
          .join("");
      }
    });
  }
});

// Get DOM elements
const changeColorBtn = document.getElementById("changeColorBtn");
const colorModal = document.getElementById("colorModal");
const closeModal = document.querySelector(".close");
const colorPicker = document.getElementById("colorPicker");

// Open the modal when the button is clicked
changeColorBtn.addEventListener("click", () => {
  colorModal.style.display = "flex"; // Show the modal
});

// Close the modal when the close button is clicked
closeModal.addEventListener("click", () => {
  colorModal.style.display = "none"; // Hide the modal
});

// Close the modal when clicking outside of it
window.addEventListener("click", (event) => {
  if (event.target === colorModal) {
    colorModal.style.display = "none"; // Hide the modal
  }
});

// Change the background color when a color is picked
colorPicker.addEventListener("input", (event) => {
  const selectedColor = event.target.value;
  document.body.style.backgroundColor = selectedColor;

  // Save the selected color to localStorage
  localStorage.setItem("backgroundColor", selectedColor);
});

// Load the saved background color on page load
window.addEventListener("load", () => {
  const savedColor = localStorage.getItem("backgroundColor");
  if (savedColor) {
    document.body.style.backgroundColor = savedColor;
    colorPicker.value = savedColor;
  }
});
