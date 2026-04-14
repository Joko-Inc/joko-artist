import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Navbar } from "./components/Navbar";
import Dashboard from './pages/Dashboard';

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
            <Route path="/create" element={<div style={{ color: 'white' }}>Create Page WIP</div>} />
            <Route path="/analytics" element={<div style={{ color: 'white' }}>Analytics Page WIP</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;