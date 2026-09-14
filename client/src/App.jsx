import React, { useState, useEffect } from 'react';
import { Database, LogOut, Bell } from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import StudentDashboard from './components/StudentDashboard';
import Login from './components/Login';
import Register from './components/Register';

const API = 'http://localhost:5000/api';
const SERVER_URL = 'http://localhost:5000';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved && saved !== 'undefined' ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [regMessage, setRegMessage] = useState('');

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

  const handleLoginSuccess = (newToken, user) => {
    setCurrentUser(user);
    setToken(newToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', newToken);
    loadData();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken('');
    setProjects([]);
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
    return authView === 'login' ? (
      <Login 
        API={API} 
        onLogin={handleLoginSuccess} 
        switchToRegister={() => { setAuthView('register'); setRegMessage(''); }} 
        initialError={regMessage}
      />
    ) : (
      <Register 
        API={API} 
        switchToLogin={() => setAuthView('login')} 
        onRegisterSuccess={(msg) => { setAuthView('login'); setRegMessage(msg); }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans selection:bg-indigo-600 selection:text-white">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 mb-6 border-b border-slate-800/80 gap-4 bg-slate-900/60 backdrop-blur-xl px-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl shadow-inner">
            <Database className="text-indigo-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">AcademeSync</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FYP Verification Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-bold text-white">{currentUser.name}</div>
            <div className="text-[10px] uppercase text-indigo-400 font-mono tracking-wider">
              {currentUser.role} {currentUser.faculty ? `• ${currentUser.faculty} (${currentUser.batch})` : ''}
            </div>
          </div>
          
          <div className="relative">
            <button onClick={toggleNotifications} className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl hover:bg-slate-800 transition relative shadow-sm cursor-pointer">
              <Bell className="w-4 h-4 text-slate-300" />
              {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-slate-900 rounded-full"></span>}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-3 max-h-80 overflow-y-auto backdrop-blur-2xl">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-4">Notifications</h3>
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-500 px-4 pb-2">No recent activity.</div>
                ) : notifications.map((n, i) => (
                  <div key={i} className={`px-4 py-2.5 text-xs border-b border-slate-800/50 last:border-0 ${n.read ? 'text-slate-400' : 'bg-slate-800/50 text-white font-semibold'}`}>
                    {n.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="p-2.5 bg-slate-900 border border-slate-800 text-rose-400 rounded-2xl hover:bg-rose-500/10 hover:border-rose-500/20 transition shadow-sm cursor-pointer" title="Log Out Session">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs font-semibold">Loading synchronized workspace...</div>
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