import React from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getUserByUsername } from '../services/userService';

const UserSearch = () => {
  const navigate = useNavigate();

  const handleUserSearch = async (username) => {
    try {
      const userId = await getUserByUsername(username);
      if (userId) {
        navigate(`/profile?uid=${userId}`);
      } else {
        alert('User not found');
      }
    } catch (error) {
      console.error('Error searching user:', error);
      alert('Error searching for user');
    }
  };

  return (
    <div className="pt-32 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-8 font-pacifico">
            Search Users by Username
          </h1>
          <div className="max-w-2xl mx-auto">
            <SearchBar 
              onSearch={handleUserSearch}
              placeholder="Enter username and press Enter..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSearch;