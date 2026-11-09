import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import IntroPg from './pages/IntroPg';
import ClientIntroPg from './pages/ClientIntroPg';
import ServerIntroPg from './pages/ServerIntroPg';
import LeaderboardPg from './pages/LeaderboardPg';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Routes>
          <Route path="/" element={<IntroPg />} />
          <Route
            path="/clientpg"
            element={
              <ProtectedRoute>
                <ClientIntroPg />
              </ProtectedRoute>
            }
          />
          <Route
            path="/serverpg"
            element={
              <ProtectedRoute>
                <ServerIntroPg />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPg />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
