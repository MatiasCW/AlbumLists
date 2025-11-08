import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData, updateUserProfile } from '../services/userService';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [showPfpModal, setShowPfpModal] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const uid = searchParams.get('uid') || user?.uid;

  // Predefined profile pictures and backgrounds
  const profilePictures = Array.from({ length: 23 }, (_, i) => `./media/pfp/pfp${i + 1}.jpg`);
  const backgrounds = Array.from({ length: 12 }, (_, i) => `./media/bg/bg${i + 1}.jpg`);

  useEffect(() => {
    if (uid) {
      loadUserProfile(uid);
    }
  }, [uid]);

  const loadUserProfile = async (userId) => {
    const userData = await getUserData(userId);
    setProfileUser(userData);
  };

  const handleViewList = () => {
    navigate(`/list?uid=${uid}`);
  };

  const handlePfpSelect = async (pfpPath) => {
    if (!user || user.uid !== uid) return;

    try {
      await updateUserProfile(uid, { profilePicture: pfpPath });
      setProfileUser(prev => ({ ...prev, profilePicture: pfpPath }));
      setShowPfpModal(false);
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture');
    }
  };

  const handleBgSelect = async (bgPath) => {
    if (!user || user.uid !== uid) return;

    try {
      await updateUserProfile(uid, { backgroundImage: bgPath });
      setProfileUser(prev => ({ ...prev, backgroundImage: bgPath }));
      setShowBgModal(false);
    } catch (error) {
      console.error('Error updating background:', error);
      alert('Failed to update background');
    }
  };

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const isOwner = user?.uid === uid;

  return (
    <div className="min-h-screen">
      <div
        className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-0"
        style={{ backgroundImage: `url('${profileUser.backgroundImage}')` }}
      />

      <div className="pt-32 px-4 relative z-10">
        <div className="profile-container max-w-2xl mx-auto bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white border-opacity-30">
          <div className="flex flex-col items-center space-y-6">
            <div className="text-center">
              <div className="username text-3xl font-bold text-gray-800 mb-4">
                {profileUser.username}
              </div>
              <img
                src={profileUser.profilePicture}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-blue-500 shadow-lg mx-auto"
              />
            </div>

            {isOwner && (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
                <button
                  className="upload-btn bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
                  onClick={() => setShowPfpModal(true)}
                >
                  Change Avatar
                </button>
                <button
                  className="upload-btn bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200"
                  onClick={() => setShowBgModal(true)}
                >
                  Change Background
                </button>
              </div>
            )}

            <div className="w-full">
              <button
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 mt-6"
                onClick={handleViewList}
              >
                View Album List
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* Favorite Artists Section */}
      <div className="favorite-artists-section mt-8 w-full">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Favorite Artists</h3>
        <FavoriteArtistsGrid userId={uid} />
      </div>

      {/* Profile Picture Modal */}
      {showPfpModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Choose Profile Picture</h2>
              <button
                className="close text-2xl hover:text-gray-700"
                onClick={() => setShowPfpModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="image-options grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {profilePictures.map((pfp, index) => (
                <div
                  key={index}
                  className="image-option cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  onClick={() => handlePfpSelect(pfp)}
                >
                  <img
                    src={pfp}
                    alt={`Profile ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Background Modal */}
      {showBgModal && (
        <div className="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-content bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Choose Background</h2>
              <button
                className="close text-2xl hover:text-gray-700"
                onClick={() => setShowBgModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="image-options grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {backgrounds.map((bg, index) => (
                <div
                  key={index}
                  className="image-option cursor-pointer transform hover:scale-105 transition-transform duration-200"
                  onClick={() => handleBgSelect(bg)}
                >
                  <img
                    src={bg}
                    alt={`Background ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border-2 border-gray-300 hover:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;