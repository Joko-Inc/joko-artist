import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Navbar } from './components/Navbar';
import { isTransferNoticeDismissed, TeamTransferNotice } from './components/TeamTransferNotice';
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Scheduled from './pages/Scheduled';
import Analytics from './pages/Analytics';
import Monetization from './pages/Monetization';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import { isLoggedIn, removeToken } from './auth';

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="app-container">
      <Navbar onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<Create />} />
          <Route path="/scheduled" element={<Scheduled />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/monetization" element={<Monetization />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}

function PublicApp({ onLogin }: { onLogin: () => void }) {
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login onLogin={onLogin} />} />
      <Route path="*" element={<Navigate to="/onboarding" replace />} />
    </Routes>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [showNotice, setShowNotice] = useState(() => !isTransferNoticeDismissed());

  const handleLogin = () => setLoggedIn(true);

  const handleLogout = () => {
    removeToken();
    setLoggedIn(false);
  };

  return (
    <Router>
      {!loggedIn && showNotice && (
        <TeamTransferNotice onDismiss={() => setShowNotice(false)} />
      )}
      {loggedIn ? (
        <AuthenticatedApp onLogout={handleLogout} />
      ) : (
        <PublicApp onLogin={handleLogin} />
      )}
    </Router>
  );
}

export default App;
