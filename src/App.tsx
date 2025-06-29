import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ClockInPage from './pages/ClockInPage';
import EnrollmentPage from './pages/EnrollmentPage';
import Clock from './components/Clock';
import StaffStatusDisplay from './components/StaffStatusDisplay';
import './App.css';

// Helper component to detect current route
const AppContent = () => {
  
  return (
    <main className="app-content">
      <div className="side-panel">
        <Clock />
        <div className="panel-info">
          <h3>Unity Timekeeper</h3>
          <p>Facial recognition-powered time tracking system</p>
        </div>
        <StaffStatusDisplay />
        <nav className="side-panel-nav">
          <Link to="/enrollment" className="nav-button">
            Register New Staff
          </Link>
        </nav>
      </div>
      <div className="main-content">
        <Routes>
          <Route path="/" element={<ClockInPage />} />
          <Route path="/enrollment" element={<EnrollmentPage />} />
        </Routes>
      </div>
    </main>
  );
};

function App() {
  return (
    <Router>
      <div className="app">
        {/* Header has been removed for a more compact, kiosk-style UI */}
        <AppContent />

        <footer className="app-footer">
          <p>
            Unity Timekeeper &copy; {new Date().getFullYear()} - Facial Recognition Time Tracking
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
