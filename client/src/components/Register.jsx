import React, { useState } from 'react';
import { Lock, User, Mail, ArrowRight } from 'lucide-react';

export default function Register({ API, switchToLogin, onRegisterSuccess }) {
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'student', faculty: 'BCA', batch: '2022' });
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      onRegisterSuccess(data.message || 'Registration successful. Awaiting admin verification.');
    } catch (err) {
      setAuthError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 hover:border-indigo-500/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6 transition duration-300">
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-400">Set up your portal profile</p>
        </div>

        {authError && (
          <div className="p-3.5 bg-rose-500/10 text-rose-400 text-xs rounded-2xl font-bold border border-rose-500/20 text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60 space-y-3.5 shadow-inner">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="text" placeholder="Kashmir Lama" required value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition duration-200" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Institutional Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="email" placeholder="student@tupandah.edu.np" required value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition duration-200" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="password" placeholder="••••••••" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition duration-200" />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Account Role</label>
              <select value={authForm.role} onChange={e => setAuthForm({...authForm, role: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none cursor-pointer transition">
                <option value="student">Student Candidate</option>
                <option value="supervisor">Faculty Supervisor</option>
                <option value="admin">Admin / Coordinator</option>
              </select>
            </div>

            {authForm.role === 'student' && (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Faculty</label>
                  <select value={authForm.faculty} onChange={e => setAuthForm({...authForm, faculty: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer">
                    <option value="BCA">BCA</option>
                    <option value="BSC.CSIT">BSc.CSIT</option>
                    <option value="BIT">BIT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Batch</label>
                  <select value={authForm.batch} onChange={e => setAuthForm({...authForm, batch: e.target.value})} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer">
                    <option value="2021">2021</option>
                    <option value="2022">2022</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition duration-200 text-white text-xs cursor-pointer">
            {loading ? 'Creating Account...' : 'Register Account'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Already have an account?{' '}
          <button onClick={switchToLogin} className="text-indigo-400 font-bold hover:underline cursor-pointer">
            Login here
          </button>
        </div>
      </div>
    </div>
  );
}