import React, { useState, useEffect } from 'react';

const BackgroundSlideshow = () => {
  const backgrounds = [
    './media/snoop.jpg',
    './media/juice.jpg',
    './media/tscott.jpg',
    './media/duki.jpg',
    './media/migos.jpg',
    './media/bruno.jpg',
    './media/malone.jpg',
    './media/theweeknd.jpg',
    './media/guitar.jpg',
    './media/shakira.jpg'
  ];

  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [backgrounds.length]);

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[-1] bg-cover bg-center transition-all duration-1000"
      style={{
        backgroundImage: `url(${backgrounds[currentBg]})`
      }}
    />
  );
};

export default BackgroundSlideshow;