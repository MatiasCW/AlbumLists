import React from 'react';
import { useNavigate } from 'react-router-dom';

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();

  const handleAlbumClick = () => {
    navigate(`/album?albumId=${album.id}`);
  };

  return (
    <div 
      className="text-center bg-white p-6 rounded-xl shadow-md transition-all duration-300 cursor-pointer hover:-translate-y-2 hover:shadow-xl border border-gray-100"
      onClick={handleAlbumClick}
    >
      <div className="flex justify-center mb-4">
        <img 
          src={album.images?.[0]?.url || album.image || './media/default-album.jpg'} 
          alt={album.name} 
          className="w-32 h-32 rounded-lg object-cover border-4 border-blue-500 shadow-md"
          onError={(e) => { e.target.src = './media/default-album.jpg'; }} 
        />
      </div>
      <div className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 h-14 flex items-center justify-center">
        {album.name}
      </div>
      <div className="text-yellow-500 text-base font-bold flex items-center justify-center space-x-1">
        <span>⭐</span>
        <span>{album.averageScore?.toFixed(1) || '0.0'}</span>
      </div>
    </div>
  );
};

export default AlbumCard;