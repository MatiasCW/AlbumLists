import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import List from './pages/List';
import Rankings from './pages/Rankings';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Albums from './pages/Albums';
import UserSearch from './pages/UserSearch';
import LandingPage from './pages/LandingPage';
import './styles/style.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/list" element={<List />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/search" element={<LandingPage />} />
            <Route path="/search-albums" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/albums" element={<Albums />} />
            <Route path="/usearch" element={<UserSearch />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;