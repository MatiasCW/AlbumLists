import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-gray-900 text-white p-4 h-20 flex items-center fixed w-full top-0 z-50 border-b border-gray-700 shadow-lg">
      <div className="container mx-auto w-11/12 max-w-7xl flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-3 no-underline">
            <img 
              src="./media/logo.png" 
              alt="Sounada" 
              className="h-12 w-auto transition-transform duration-300 hover:scale-105" 
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Sounada
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex justify-center">
          <ul className="flex items-center space-x-8 list-none">
            <li>
              <Link
                to="/"
                className="text-gray-300 no-underline font-medium px-3 py-2 transition-all duration-300 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/list"
                className="text-gray-300 no-underline font-medium px-3 py-2 transition-all duration-300 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                My List
              </Link>
            </li>
            <li>
              <Link
                to="/rankings"
                className="text-gray-300 no-underline font-medium px-3 py-2 transition-all duration-300 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                Rankings
              </Link>
            </li>
            <li>
              <Link
                to="/search"
                className="text-gray-300 no-underline font-medium px-3 py-2 transition-all duration-300 hover:text-white hover:bg-gray-800 rounded-lg"
              >
                Search
              </Link>
            </li>
          </ul>
        </nav>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="flex items-center space-x-3 bg-gray-800 rounded-full pl-3 pr-1 py-1">
                <span className="text-sm font-medium text-gray-200">
                  {userData?.username || user.email?.split('@')[0]}
                </span>
                <Link
                  to={`/profile?uid=${user.uid}`}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  {userData?.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                </Link>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 rounded-lg text-gray-200 font-medium hover:bg-gray-600 transition-colors duration-200 border border-gray-600"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 font-medium hover:text-white transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;