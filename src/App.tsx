import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Navbar } from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Scheduled from './pages/Scheduled';
import Analytics from './pages/Analytics';
import Monetization from './pages/Monetization';
import Login from './pages/Login';
import { isLoggedIn, removeToken } from './auth';

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/scheduled" element={<Scheduled />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monetization" element={<Monetization />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
