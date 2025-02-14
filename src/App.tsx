import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './pages/firebase';  // Import Firebase auth instance
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import RoomMatrix from './pages/RoomMatrix';
import BookedRooms from './pages/BookedRooms';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import PaymentLogs from './pages/PaymentLogs';
import CheckIn from './pages/CheckIn';
import Login from './pages/Login1';  // Import Login Page

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [user, setUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(!!currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return user ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/rooms" element={<ProtectedRoute><RoomMatrix /></ProtectedRoute>} />
            <Route path="/booked-rooms" element={<ProtectedRoute><BookedRooms /></ProtectedRoute>} />
            <Route path="/check-in/:roomId?" element={<ProtectedRoute><CheckIn /></ProtectedRoute>} />
            <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><PaymentLogs /></ProtectedRoute>} />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
