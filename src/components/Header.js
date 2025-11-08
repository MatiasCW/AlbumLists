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
    <header className="bg-gray-800 bg-opacity-80 text-white p-3 h-28 flex items-center fixed w-full top-0 z-50">
      <div className="container mx-auto w-11/12 max-w-6xl flex items-center justify-between">
        <div className="logo mr-5">
          <Link to="/">
            <img src="./media/logo.png" alt="Logo" className="h-20 w-auto" />
          </Link>
        </div>

        <h1 className="text-3xl flex-grow text-center font-pacifico text-yellow-400 animate-glowPulse">
          Sounada
        </h1>

        <nav className="flex items-center justify-between w-full">
          <ul className="nav-links flex justify-center list-none flex-1 space-x-6">
            <li>
              <Link
                to="/"
                className="text-yellow-400 no-underline text-xl font-pacifico px-3 py-2 transition-all duration-300 hover:text-yellow-300 hover:scale-105"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                to="/list"
                className="text-yellow-400 no-underline text-xl font-pacifico px-3 py-2 transition-all duration-300 hover:text-yellow-300 hover:scale-105"
              >
                List
              </Link>
            </li>
            <li>
              <Link
                to="/rankings"
                className="text-yellow-400 no-underline text-xl font-pacifico px-3 py-2 transition-all duration-300 hover:text-yellow-300 hover:scale-105"
              >
                Rankings
              </Link>
            </li>
            <li>
              <Link
                to="/search"
                className="text-yellow-400 no-underline text-xl font-pacifico px-3 py-2 transition-all duration-300 hover:text-yellow-300 hover:scale-105"
              >
                Search
              </Link>
            </li>
          </ul>

          <div className="auth-section flex justify-end items-center ml-auto space-x-3">
            {user ? (
              <>
                <span className="mr-4">
                  <Link
                    to={`/profile?uid=${user.uid}`}
                    className="text-white hover:text-yellow-400 transition-colors duration-200"
                  >
                    {userData?.username || user.email}
                  </Link>
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 rounded-lg text-white font-bold hover:bg-red-600 transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-gray-600 rounded-lg text-white no-underline hover:bg-gray-500 transition-colors duration-200"
                >
                  Sign Up
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-gray-600 rounded-lg text-white no-underline hover:bg-gray-500 transition-colors duration-200"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;