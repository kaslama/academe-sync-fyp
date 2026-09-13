import React, { useState, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import StudentDashboard from './components/StudentDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminDashboard from './components/AdminDashboard';
import { ShieldAlert, CheckCircle } from 'lucide-react';

export default function App() {
  const { user, login, loading } = useContext(AuthContext);
  const [isRegister, setIsRegister] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [authError, setAuthError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-400">
        Authenticating session...
      </div>
    );
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setPendingMessage('');
    setAuthLoading(true);

    const endpoint = isRegister ? 'register' : 'login';
    try {
      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (!res.ok) {
        setAuthError(data.message || 'Authentication operation failed');
      } else if (data.requiresApproval) {
        // Handle asynchronous Admin Approval workflow
        setPendingMessage(data.message); 
        setIsRegister(false);
        setAuthForm({ ...authForm, password: '' }); // Clear password for security
      } else {
        login(data.token, data.user);
      }
    } catch (err) {
      setAuthError('Connection refused by server. Ensure backend is running on port 5000.');
    } finally {
      setAuthLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AUTHENTICATION PORTAL (UNAUTHENTICATED VIEW)
  // ---------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-wide">AcademeSync</h1>
            <p className="text-sm text-slate-400 mt-2">FYP Verification & Allotment Portal</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300">{authError}</p>
            </div>
          )}

          {pendingMessage && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-300">{pendingMessage}</p>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Institutional Role</label>
                  <select
                    value={authForm.role}
                    onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="student">Student Candidate</option>
                    <option value="supervisor">Faculty Supervisor</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Institutional Email</label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="name@institution.edu"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
              <input
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition mt-2 disabled:opacity-50"
            >
              {authLoading ? 'Connecting...' : (isRegister ? 'Submit Registration Request' : 'Authenticate Session')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError('');
                setPendingMessage('');
              }}
              className="text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              {isRegister ? 'Already have an approved account? Log in' : 'Need an account? Register here'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN DASHBOARD ROUTING (AUTHENTICATED VIEW)
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0b0f19] p-6 font-sans text-slate-200 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-6">
        <Navbar />
        
        {/* Role-Based Access Control Routing */}
        {user.role === 'student' && <StudentDashboard />}
        {user.role === 'supervisor' && <SupervisorDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
        
      </div>
    </div>
  );
}