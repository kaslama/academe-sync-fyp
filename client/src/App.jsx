import React, { useState, useEffect } from 'react';
import { Database, LogOut, Lock, User, Mail, Bell } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import StudentDashboard from './components/StudentDashboard';

const API = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  
  const [authMode, setAuthMode] = useState('login'); 
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'student', faculty: 'BCA', batch: '2022' });
  const [authError, setAuthError] = useState('');

  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ domains: [], statuses: [] });
  const [supervisorsList, setSupervisorsList] = useState([]);
  const [allUsers, setAllUsers] = useState([]); 
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  useEffect(() => { 
    if (currentUser && token) {
      loadData(); 
    }
  }, [currentUser, token]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/projects`, { headers: getHeaders() });
      if (res.ok) setProjects(await res.json());

      const notifRes = await fetch(`${API}/notifications`, { headers: getHeaders() });
      if (notifRes.ok) setNotifications(await notifRes.json());

      if (currentUser?.role === 'admin') {
        const supRes = await fetch(`${API}/users/supervisors`, { headers: getHeaders() });
        if (supRes.ok) setSupervisorsList(await supRes.json());

        const usersRes = await fetch(`${API}/users`, { headers: getHeaders() });
        if (usersRes.ok) setAllUsers(await usersRes.json());
      }
      if (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') {
        const statsRes = await fetch(`${API}/projects/stats`, { headers: getHeaders() });
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? `${API}/auth/login` : `${API}/auth/register`;
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (authMode === 'register') {
        setAuthMode('login');
        setAuthError(data.message || 'Registration successful. Awaiting admin verification.');
      } else {
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        loadData();
      }
    } catch (err) { setAuthError(err.message); }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    setProjects([]);
    setAuthForm({ name: '', email: '', password: '', role: 'student', faculty: 'BCA', batch: '2022' });
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (notifications.some(n => !n.read)) {
      await fetch(`${API}/notifications/read`, { method: 'PATCH', headers: getHeaders() });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white"><Database className="w-8 h-8" /></div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">AcademeSync FYP</h2>
          {authError && <div className={`p-3 rounded-xl text-xs mb-4 text-center font-bold ${authError.includes('successful') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && (
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="text" placeholder="Full Name" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition" />
              </div>
            )}
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input type="email" placeholder="Email" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition" />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input type="password" placeholder="Password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition" />
            </div>
            {authMode === 'register' && (
              <>
                <select value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-300 focus:border-indigo-500 transition">
                  <option value="student">Student Candidate</option>
                  <option value="supervisor">Faculty Supervisor</option>
                  <option value="admin">Admin / Coordinator</option>
                </select>

                {authForm.role === 'student' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Faculty</label>
                      <select value={authForm.faculty} onChange={e => setAuthForm({...authForm, faculty: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none text-slate-300">
                        <option value="BCA">BCA</option>
                        <option value="BSC.CSIT">BSc.CSIT</option>
                        <option value="BIT">BIT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Batch</label>
                      <select value={authForm.batch} onChange={e => setAuthForm({...authForm, batch: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none text-slate-300">
                        <option value="2021">2021</option>
                        <option value="2022">2022</option>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition">
              {authMode === 'login' ? 'Authenticate' : 'Create Account'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-400">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="text-indigo-400 font-bold hover:underline">
              {authMode === 'login' ? 'Register here' : 'Login here'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-6 font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <Database className="text-indigo-500 w-6 h-6" />
          <h1 className="text-xl font-bold">AcademeSync</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold">{currentUser.name}</div>
            <div className="text-[10px] uppercase text-indigo-400 tracking-wider">
              {currentUser.role} {currentUser.faculty ? `• ${currentUser.faculty} (${currentUser.batch})` : ''}
            </div>
          </div>
          
          <div className="relative">
            <button onClick={toggleNotifications} className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition relative">
              <Bell className="w-4 h-4 text-slate-300" />
              {notifications.some(n => !n.read) && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full"></span>}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-2 max-h-80 overflow-y-auto">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 px-4">Notifications</h3>
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-500 px-4 pb-2">No recent activity.</div>
                ) : notifications.map((n, i) => (
                  <div key={i} className={`px-4 py-2 text-xs border-b border-slate-800/50 last:border-0 ${n.read ? 'text-slate-400' : 'bg-slate-800/50 text-white font-bold'}`}>
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="p-2 bg-slate-900 border border-slate-800 text-rose-400 rounded-xl hover:bg-rose-500/10 transition">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="mt-8 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading synchronized workspace...</div>
        ) : (
          <>
            {currentUser.role === 'admin' && (
              <AdminDashboard 
                currentUser={currentUser} 
                token={token} 
                projects={projects} 
                stats={stats} 
                supervisorsList={supervisorsList} 
                allUsers={allUsers} 
                loadData={loadData} 
                SERVER_URL={SERVER_URL}
                API={API}
              />
            )}
            {currentUser.role === 'supervisor' && (
              <SupervisorDashboard 
                currentUser={currentUser} 
                token={token} 
                projects={projects} 
                stats={stats} 
                loadData={loadData} 
                SERVER_URL={SERVER_URL}
                API={API}
              />
            )}
            {currentUser.role === 'student' && (
              <StudentDashboard 
                currentUser={currentUser} 
                token={token} 
                projects={projects} 
                loadData={loadData} 
                SERVER_URL={SERVER_URL}
                API={API}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}