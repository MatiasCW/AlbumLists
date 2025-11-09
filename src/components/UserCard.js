import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/profile?uid=${user.id}`);
  };

  return (
    <div
      className="text-center bg-white p-6 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl border border-gray-100"
      onClick={handleClick}
    >
      <div className="flex justify-center mb-4">
        <img
          src={user.data.profilePicture || './media/default.jpg'}
          alt={user.data.username}
          className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-md"
          onError={(e) => { e.target.src = './media/default.jpg'; }}
        />
      </div>
      <div className="font-bold text-lg text-gray-800">
        {user.data.username || 'Anonymous'}
      </div>
    </div>
  );
};

export default UserCard;