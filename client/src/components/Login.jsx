import React, { useState } from 'react';
import { Database, LogIn, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login({ API, onLogin, switchToRegister, initialError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Invalid credentials');
      }

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-6 font-sans selection:bg-red-600 selection:text-white">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl shadow-inner">
            <Database className="text-red-600 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">AcademeSync</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">FYP Verification Portal</p>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="text-xs text-slate-500">Sign in to access your institutional dashboard workspace.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Institutional Email</label>
            <input 
              type="email" 
              required 
              placeholder="e.g. user@univ.edu"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Secure Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3.5 rounded-xl text-slate-900 outline-none transition shadow-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don't have an institutional account?{' '}
            <button 
              onClick={switchToRegister} 
              className="text-red-600 font-bold hover:underline cursor-pointer ml-1"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}