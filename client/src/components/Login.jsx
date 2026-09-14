import React, { useState } from 'react';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login({ API, onLogin, switchToRegister, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid credentials');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100 font-sans selection:bg-indigo-600 selection:text-white">
      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 hover:border-indigo-500/40 p-8 rounded-3xl shadow-2xl relative overflow-hidden space-y-6 transition duration-300">
        <div className="absolute -right-16 -top-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-1 text-center">
          <h2 className="text-xl font-black text-white tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400">Sign in to your account dashboard</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 text-rose-400 text-xs rounded-2xl font-bold border border-rose-500/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/60 space-y-3.5 shadow-inner">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Institutional Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="email5" placeholder="student@tupandah.edu.np" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition duration-200" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900/90 border border-slate-800 focus:border-indigo-500/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white outline-none transition duration-200" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] rounded-2xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition duration-200 text-white text-xs cursor-pointer">
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Don't have an account?{' '}
          <button onClick={switchToRegister} className="text-indigo-400 font-bold hover:underline cursor-pointer">
            Register here
          </button>
        </div>
      </div>
    </div>
  );
}