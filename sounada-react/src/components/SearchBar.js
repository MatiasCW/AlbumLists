import React, { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-6 py-4 text-xl border border-gray-300 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500 shadow-lg transition-all duration-200"
        />
      </form>
    </div>
  );
};

export default SearchBar;