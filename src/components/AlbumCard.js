// In the Albums.js file, update the AlbumCard usage:
{albums.map(album => {
  const rating = albumRatings[album.id];
  const hasRating = rating && !rating.needsMoreRatings;

  return (
    <div key={album.id} className="relative">
      <AlbumCard 
        album={{
          ...album,
          // Pass the rating data to AlbumCard so it can display the stars
          averageScore: hasRating ? rating.averageScore : 0
        }} 
      />

      {/* Rating Display Overlay */}
      <div className="absolute top-3 right-3 bg-black bg-opacity-70 rounded-lg p-2 backdrop-blur-sm">
        <div className="text-white font-bold text-sm text-center">
          {hasRating ? rating.averageScore?.toFixed(1) : 'N/A'}
        </div>
        {rating && (
          <div className="text-xs text-gray-300 text-center mt-1">
            {rating.numberOfRatings || 0} rating{rating.numberOfRatings !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Global Rank Badge */}
      {hasRating && rating.rank && (
        <div className="absolute top-3 left-3 bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold shadow-lg">
          #{rating.rank}
        </div>
      )}
    </div>
  );
})}