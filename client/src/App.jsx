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
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      } else {
        setProjects([]);
      }

      const notifRes = await fetch(`${API}/notifications`, { headers: getHeaders() });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(Array.isArray(notifData) ? notifData : []);
      } else {
        setNotifications([]);
      }

      if (currentUser?.role === 'admin') {
        const supRes = await fetch(`${API}/users/supervisors`, { headers: getHeaders() });
        if (supRes.ok) {
          const supData = await supRes.json();
          setSupervisorsList(Array.isArray(supData) ? supData : []);
        }

        const usersRes = await fetch(`${API}/users`, { headers: getHeaders() });
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setAllUsers(Array.isArray(usersData) ? usersData : []);
        }
      }
      if (currentUser?.role === 'admin' || currentUser?.role === 'supervisor') {
        const statsRes = await fetch(`${API}/projects/stats`, { headers: getHeaders() });
        if (statsRes.ok) setStats(await statsRes.json());
      }
    } catch (e) { 
      console.error(e); 
      setProjects([]);
      setNotifications([]);
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
    <div className="min-h-screen bg-slate-100 print:bg-white text-slate-800 p-6 font-sans selection:bg-red-600 selection:text-white">
      <header className="flex flex-col sm:flex-row justify-between items-center pb-6 mb-6 border-b border-slate-300 print:border-black gap-4 bg-white print:bg-transparent px-6 rounded-2xl shadow-sm print:shadow-none relative z-50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-2xl shadow-inner print:shadow-none print:border-black">
            <Database className="text-red-600 print:text-black w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 print:text-black tracking-tight">AcademeSync</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 print:text-slate-800">FYP Verification Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4 print:hidden">
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
            <div className="text-[10px] uppercase text-red-600 font-mono tracking-wider">
              {currentUser.role} {currentUser.faculty ? `• ${currentUser.faculty} (${currentUser.batch})` : ''}
            </div>
          </div>
          
          <div className="relative">
            <button onClick={toggleNotifications} className="p-2.5 bg-white border border-slate-300 rounded-2xl hover:bg-slate-50 transition relative shadow-sm cursor-pointer" title="Notifications">
              <Bell className="w-4 h-4 text-slate-700" />
              {notifications.some(n => !n.read) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 border-2 border-white rounded-full"></span>}
            </button>
            
            {showNotifications && (
              /* FIXED POSITIONING ESCAPES SIBLING OVERFLOW-HIDDEN CLIPPING */
              <div className="fixed right-6 top-20 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[99999] py-3 max-h-80 overflow-y-auto text-slate-800">
                <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center mb-1">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Notifications</h3>
                  <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                    {notifications.filter(n => !n.read).length} Unread
                  </span>
                </div>
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-500 px-4 py-3">No recent activity.</div>
                ) : [...notifications].reverse().map((n, i) => (
                  <div key={i} className={`px-4 py-2.5 text-xs border-b border-slate-100 last:border-0 ${n.read ? 'text-slate-500' : 'bg-slate-50 text-slate-900 font-semibold'}`}>
                    <p>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="p-2.5 bg-white border border-slate-300 text-red-600 rounded-2xl hover:bg-red-50 hover:border-red-300 transition shadow-sm cursor-pointer" title="Log Out Session">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-xs font-semibold print:hidden">Loading synchronized workspace...</div>
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