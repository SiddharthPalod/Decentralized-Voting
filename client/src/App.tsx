import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import About from "./components/About"
// import Home from './components/Home';
// import Dashboard from './components/User/Dashboard';
// import Help from './components/Help';
// import Collections from './components/User/Collections';
// import Leadership from './components/User/Leadership';
// import Challenges from './components/User/Challenges';
// import Tasks from './components/User/Tasks';
import IntroPg from './pages/IntroPg';
import ClientIntroPg from './pages/ClientIntroPg';
import ServerIntroPg from './pages/ServerIntroPg';

function App() {
  return (
    <>
    <Router>
      <Routes>
        <Route path="/" element={<IntroPg />} />
        <Route path="/clientpg" element={<ClientIntroPg />} />
        <Route path="/serverpg" element={<ServerIntroPg />} />
        {/* <Route path="/about" element={<About />} /> */}
        {/* <Route path="/user/:walletAddress/*" element={<Dashboard />} /> */}
        {/* <Route path="/user/:walletAddress/collections" element={<Collections />} /> */}
        {/* <Route path="/user/:walletAddress/tasks" element={<Tasks />} /> */}
        {/* <Route path="/user/:walletAddress/leadershipboard" element={<Leadership />} /> */}
        {/* <Route path="/user/:walletAddress/challenges" element={<Challenges />} /> */}
        {/* <Route path="/help" element={<Help/>} /> */}
      </Routes>
    </Router>
    </>
  )
}

export default App
