const clientId = '2b46bd9e8aef47908b9b92deac88846b';
const clientSecret = '681a685c75e542c49f101ae8909f3be8';
let accessToken = '';

// Helper function to get access token
const getAccessToken = async () => {
  if (!accessToken) {
    await fetchAccessToken();
  }
  return accessToken;
};

export const fetchAccessToken = async () => {
  const authHeader = 'Basic ' + btoa(`${clientId}:${clientSecret}`);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    accessToken = data.access_token;
    return accessToken;
  } catch (error) {
    console.error('Error fetching access token:', error);
    throw error;
  }
};

export const searchArtist = async (artistName) => {
  if (!accessToken) await fetchAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  return data.artists.items[0];
};

export const fetchArtistAlbums = async (artistId) => {
  if (!accessToken) await fetchAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=50&include_groups=album`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  return data.items.filter(album => album.album_type === 'album');
};

export const fetchArtistDetails = async (artistId) => {
  if (!accessToken) await fetchAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return await response.json();
};

// NEW: Fetch album details
export const fetchAlbumDetails = async (albumId) => {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch album details');
  }
  
  return await response.json();
};

// NEW: Fetch album tracks
export const fetchAlbumTracks = async (albumId) => {
  const token = await getAccessToken();
  
  const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch album tracks');
  }
  
  return await response.json();
};

export const searchAlbums = async (albumName) => {
  if (!accessToken) await fetchAccessToken();

  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(albumName)}&type=album&limit=20`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  const data = await response.json();
  return data.albums.items;
};