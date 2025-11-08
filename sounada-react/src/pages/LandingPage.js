import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex">
      <div 
        className="flex-1 flex items-center justify-center cursor-pointer transition-all duration-500 hover:flex-1.2 bg-cover bg-center relative group"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/media/users.jpg')"
        }}
        onClick={() => navigate('/usearch')}
      >
        <div className="text-center text-white p-8 group-hover:scale-110 transition-transform duration-500">
          <div className="text-5xl md:text-6xl mb-4">🔍</div>
          <div className="text-3xl md:text-4xl font-bold">Search Users</div>
        </div>
      </div>
      
      <div 
        className="flex-1 flex items-center justify-center cursor-pointer transition-all duration-500 hover:flex-1.2 bg-cover bg-center relative group"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/media/artists.jpg')"
        }}
        onClick={() => navigate('/search-albums')}
      >
        <div className="text-center text-white p-8 group-hover:scale-110 transition-transform duration-500">
          <div className="text-5xl md:text-6xl mb-4">🎵</div>
          <div className="text-3xl md:text-4xl font-bold">Search Albums</div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;