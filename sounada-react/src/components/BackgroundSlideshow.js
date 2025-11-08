import React from 'react';

const BackgroundSlideshow = () => {
  const backgrounds = [
    '/media/snoop.jpg',
    '/media/juice.jpg',
    '/media/tscott.jpg',
    '/media/duki.jpg',
    '/media/migos.jpg',
    '/media/bruno.jpg',
    '/media/malone.jpg',
    '/media/theweeknd.jpg',
    '/media/guitar.jpg',
    '/media/shakira.jpg'
  ];

  return (
    <div 
      className="fixed top-0 left-0 w-full h-full z-[-1] bg-cover bg-center"
      style={{
        backgroundImage: `url(${backgrounds[0]})`,
        animation: 'slideshow 50s infinite'
      }}
    />
  );
};

export default BackgroundSlideshow;