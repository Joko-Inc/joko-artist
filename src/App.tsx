import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Navbar } from "./components/Navbar";
import Dashboard from './pages/Dashboard';
import Create from './pages/Create';
import Analytics from './pages/Analytics';
import Monetization from './pages/Monetization';

/**
 * Main App Component.
 */
function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monetization" element={<Monetization />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;