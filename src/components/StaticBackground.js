import React from 'react';

const StaticBackground = () => {
  return (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[-1] bg-cover bg-center"
      style={{
        backgroundImage: "url('/media/fire.jpg')"
      }}
    />
  );
};

export default StaticBackground;