import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../services/userService';

const Profile = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const uid = searchParams.get('uid') || user?.uid;

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
                <button className="upload-btn bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200">
                  Change Avatar
                </button>
                <button className="upload-btn bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200">
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
    </div>
  );
};

export default Profile;