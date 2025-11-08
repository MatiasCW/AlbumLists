import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const List = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');
  const [showColorModal, setShowColorModal] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontColor, setFontColor] = useState('#000000');
  const uid = searchParams.get('uid') || user?.uid;

  useEffect(() => {
    if (uid) {
      fetchAlbums(uid);
      loadUserColors(uid);
    }
  }, [uid, sortOrder]);

  const fetchAlbums = async (userId) => {
    try {
      const albumsRef = collection(db, 'users', userId, 'albums');
      const querySnapshot = await getDocs(albumsRef);
      
      let albumsList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      if (sortOrder === 'desc') {
        albumsList.sort((a, b) => (b.score || 0) - (a.score || 0));
      } else if (sortOrder === 'asc') {
        albumsList.sort((a, b) => (a.score || 0) - (b.score || 0));
      }

      setAlbums(albumsList);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const loadUserColors = async (userId) => {
    if (user?.uid !== userId) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setBackgroundColor(userData.backgroundColor || '#ffffff');
        setFontColor(userData.fontColor || '#000000');
        applyColors(userData.backgroundColor, userData.fontColor);
      }
    } catch (error) {
      console.error("Error loading user colors:", error);
    }
  };

  const applyColors = (bgColor, fColor) => {
    document.body.style.backgroundColor = bgColor || '#ffffff';
    const allElements = document.querySelectorAll('body *:not(.modal *)');
    allElements.forEach(element => {
      element.style.color = fColor || '#000000';
    });
  };

  const handleColorChange = async (type, color) => {
    if (type === 'background') {
      setBackgroundColor(color);
      document.body.style.backgroundColor = color;
    } else {
      setFontColor(color);
      const allElements = document.querySelectorAll('body *:not(.modal *)');
      allElements.forEach(element => {
        element.style.color = color;
      });
    }

    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          [type === 'background' ? 'backgroundColor' : 'fontColor']: color
        });
      } catch (error) {
        console.error("Error saving colors:", error);
      }
    }
  };

  // ... rest of your existing List.js functions (handleScoreChange, handleRemoveAlbum)

  const isOwner = !searchParams.get('uid') || user?.uid === searchParams.get('uid');

  return (
    <main className="pt-32 min-h-screen px-4">
      <div className="max-w-6xl mx-auto">
        {isOwner && (
          <button 
            className="bg-gray-500 text-white px-6 py-3 rounded-lg mb-6 hover:bg-gray-600 transition-colors"
            onClick={() => setShowColorModal(true)}
          >
            Style
          </button>
        )}
        
        {/* Color Modal */}
        {showColorModal && (
          <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="modal-content bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Choose Colors</h2>
                <button 
                  className="close text-2xl hover:text-gray-700"
                  onClick={() => setShowColorModal(false)}
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="backgroundColorPicker" className="block mb-2 font-medium">
                    Background Color:
                  </label>
                  <input
                    type="color"
                    id="backgroundColorPicker"
                    value={backgroundColor}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-full h-10 cursor-pointer"
                  />
                </div>
                
                <div>
                  <label htmlFor="fontColorPicker" className="block mb-2 font-medium">
                    Font Color:
                  </label>
                  <input
                    type="color"
                    id="fontColorPicker"
                    value={fontColor}
                    onChange={(e) => handleColorChange('font', e.target.value)}
                    className="w-full h-10 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rest of your table code remains the same */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <table className="album-table w-full">
            {/* ... your existing table code ... */}
          </table>
        </div>
      </div>
    </main>
  );
};

export default List;