import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import DossierModal from './DossierModal';
import NotificationModal from './NotificationModal';
import { 
  ShieldAlert, FolderGit2, CheckCircle2, Clock, RefreshCw, 
  Search, Filter, Trash2, FileSpreadsheet, Bell, AlertTriangle,
  Users, UserCheck, User, UserPlus
} from 'lucide-react';

const API = 'http://localhost:5000/api/projects';

export default function AdminDashboard() {
  const { token } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [selectedDossierProject, setSelectedDossierProject] = useState(null);
  const [activeNotificationProject, setActiveNotificationProject] = useState(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [projRes, supRes, pendingRes] = await Promise.all([
        fetch(API, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/supervisors`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/auth/pending-users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (projRes.ok) setProjects(await projRes.json());
      if (supRes.ok) setSupervisors(await supRes.json());
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
    } catch (e) {
      console.error('Failed to load telemetry', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleAllotSupervisor = async (projectId, supervisorId) => {
    const selected = supervisors.find(s => s._id === supervisorId);
    if (!selected) return;
    try {
      const res = await fetch(`${API}/${projectId}/allot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supervisorId: selected._id, supervisorName: selected.name })
      });
      if (res.ok) fetchTelemetry();
    } catch (err) {
      console.error('Allotment failed', err);
    }
  };

  const handleDeleteProject = async (id, title) => {
    if (!window.confirm(`Purge proposal "${title}"? This will notify the student.`)) return;
    try {
      const res = await fetch(`${API}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchTelemetry();
    } catch (err) {
      console.error('Purge failed', err);
    }
  };

  const handleApproveUser = async (id) => {
    await fetch(`http://localhost:5000/api/auth/approve/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTelemetry();
  };

  const handleRejectUser = async (id) => {
    await fetch(`http://localhost:5000/api/auth/reject/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchTelemetry();
  };

  const totalCount = projects.length;
  const approvedCount = projects.filter(p => p.status === 'Approved').length;
  const underReviewCount = projects.filter(p => p.status === 'Under Review' || p.status === 'Proposed').length;
  const conflictCount = projects.filter(p => p.status === 'Flagged Conflict' || p.similarityIndex >= 60).length;

  const filteredProjects = projects.filter(p => {
    const matchesDomain = filterDomain === 'All' || p.domain === filterDomain;
    const q = search.toLowerCase();
    const titleMatch = p.title?.toLowerCase().includes(q);
    const supervisorMatch = p.supervisorName && p.supervisorName.toLowerCase().includes(q);
    const leadStudentMatch = p.studentName?.toLowerCase().includes(q) || p.studentEmail?.toLowerCase().includes(q);
    const teamMemberMatch = p.teamMembers && p.teamMembers.some(
      m => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q)
    );
    return matchesDomain && (titleMatch || supervisorMatch || leadStudentMatch || teamMemberMatch);
  });

  return (
    <div className="space-y-6 text-xs text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-5 rounded-2xl">
        <div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-white flex items-center gap-2">
            Institutional Audit &amp; Supervisor Allocation Center
          </h2>
          <p className="text-slate-400 mt-0.5">
            Administer faculty mentor allotments, verify identities, and oversee departmental proposals.
          </p>
        </div>
        <button
          onClick={fetchTelemetry}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Data</span>
        </button>
      </div>

      {/* Analytics KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Registry</span>
            <p className="text-2xl font-mono font-bold text-white mt-0.5">{totalCount}</p>
          </div>
        </div>
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Allotted &amp; Approved</span>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">{approvedCount}</p>
          </div>
        </div>
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Pending Allotment</span>
            <p className="text-2xl font-mono font-bold text-amber-400 mt-0.5">{underReviewCount}</p>
          </div>
        </div>
        <div className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Redundancy Conflicts</span>
            <p className="text-2xl font-mono font-bold text-rose-400 mt-0.5">{conflictCount}</p>
          </div>
        </div>
      </div>

      {/* Identity Verification Queue */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Pending User Verification ({pendingUsers.length})
          </h3>
        </div>
        {pendingUsers.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No pending registration requests.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold bg-slate-950/40">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Requested Role</th>
                  <th className="py-3 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {pendingUsers.map(user => (
                  <tr key={user._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white">{user.name}</td>
                    <td className="py-3 px-4 font-mono">{user.email}</td>
                    <td className="py-3 px-4">
                      <span className="text-[9px] bg-slate-800 px-2 py-0.5 rounded uppercase font-bold text-slate-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button 
                        onClick={() => handleApproveUser(user._id)}
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition font-medium"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleRejectUser(user._id)}
                        className="px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg transition font-medium"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filter and Search Bar for Projects */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, student, group member, or faculty..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <select
            value={filterDomain}
            onChange={(e) => setFilterDomain(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Research Tracks</option>
            <option value="Distributed Systems">Distributed Systems</option>
            <option value="Computer Vision">Computer Vision</option>
            <option value="NLP">NLP</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Cloud">Cloud</option>
          </select>
        </div>
      </div>

      {/* Main Capstone Registry Table */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Capstone Cohort Registry ({filteredProjects.length} Records)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 font-bold bg-slate-950/40">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4 min-w-[220px]">Candidate / Enrolled Group Members</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4">Allot Faculty Supervisor</th>
                <th className="py-3 px-4 text-center">Overlap</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No proposals match the current filter.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-semibold text-white max-w-xs">
                      <p className="truncate" title={p.title}>{p.title}</p>
                      {p.matchingTitle && p.similarityIndex >= 60 && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          Match: {p.matchingTitle.substring(0, 30)}...
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="font-semibold text-slate-100">{p.studentName}</span>
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono uppercase font-bold">Lead</span>
                        </div>
                        <p className="text-[10px] text-slate-500 pl-5">{p.studentEmail}</p>
                        {p.teamMembers && p.teamMembers.length > 0 && (
                          <div className="pt-1 pl-1 border-t border-slate-800/60 space-y-1">
                            <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" /> Group Partners ({p.teamMembers.length}):
                            </span>
                            {p.teamMembers.map((member, idx) => (
                              <div key={idx} className="pl-4 text-[11px] flex items-center justify-between gap-2">
                                <span className="text-slate-300 font-medium">{member.name}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{member.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-indigo-400 uppercase">{p.domain}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <select
                          value={p.supervisorId || ''}
                          onChange={(e) => handleAllotSupervisor(p._id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[11px] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="" disabled>-- Select Faculty --</option>
                          {supervisors.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        p.similarityIndex >= 60 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'text-emerald-400'
                      }`}>
                        {p.similarityIndex}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        p.status === 'Rejected' ? 'bg-slate-800 text-slate-400' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveNotificationProject(p)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition cursor-pointer"
                          title="View Notifications"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedDossierProject(p)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition flex items-center gap-1 font-medium cursor-pointer"
                          title="Print Dossier"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p._id, p.title)}
                          className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition cursor-pointer"
                          title="Purge / Delete Proposal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDossierProject && (
        <DossierModal
          project={selectedDossierProject}
          onClose={() => setSelectedDossierProject(null)}
          onRefresh={fetchTelemetry}
        />
      )}
      {activeNotificationProject && (
        <NotificationModal
          project={activeNotificationProject}
          onClose={() => setActiveNotificationProject(null)}
        />
      )}
    </div>
  );
}