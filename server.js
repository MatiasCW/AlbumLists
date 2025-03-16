const express = require('express');
const app = express();
const port = 8888;

// Serve static files from the "public" folder
app.use(express.static('public'));

// Handle the Spotify callback
app.get('/callback', (req, res) => {
  const code = req.query.code; // Extract the authorization code
  if (code) {
    console.log('Authorization Code:', code);
    res.send('<script>window.opener.postMessage({ code: "' + code + '" }, "*"); window.close();</script>');
  } else {
    res.status(400).send('Error: No authorization code found.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});