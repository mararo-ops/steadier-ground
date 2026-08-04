import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import PartnerView from './pages/PartnerView';
import AcceptInvite from './pages/AcceptInvite';
import PartnerDashboard from './pages/PartnerDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partner-view/:eventId" element={<PartnerView />} />
        <Route path="/accept-invite/:partnershipId" element={<AcceptInvite />} />
        <Route path="/partner-dashboard" element={<PartnerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
