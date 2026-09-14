import React, { useState } from 'react';
import { FileText, BarChart2, Layout, Users, Trash2, Filter, Paperclip, ExternalLink, X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];

export default function AdminDashboard({ currentUser, token, projects, stats, supervisorsList, allUsers, loadData, SERVER_URL, API }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [filterFaculty, setFilterFaculty] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');
  const [filterAllocation, setFilterAllocation] = useState('ALL');

  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userFilterFaculty, setUserFilterFaculty] = useState('ALL');
  const [userFilterBatch, setUserFilterBatch] = useState('ALL');

  const [expandedUserId, setExpandedUserId] = useState(null);
  const [selectedProjectModal, setSelectedProjectModal] = useState(null);

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  const assignSupervisor = async (id, supervisorName) => {
    await fetch(`${API}/projects/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ supervisor: supervisorName }) });
    loadData();
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Permanently delete this proposal?")) return;
    await fetch(`${API}/projects/${projectId}`, { method: 'DELETE', headers: getHeaders() });
    loadData();
  };

  const verifyUser = async (userId) => {
    await fetch(`${API}/users/${userId}/verify`, { method: 'PATCH', headers: getHeaders() });
    loadData();
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Permanently remove this user?")) return;
    await fetch(`${API}/users/${userId}`, { method: 'DELETE', headers: getHeaders() });
    loadData();
  };

  const filteredProjects = projects.filter(p => {
    if (filterFaculty !== 'ALL' && p.faculty !== filterFaculty) return false;
    if (filterBatch !== 'ALL' && p.batch !== filterBatch) return false;
    if (filterAllocation === 'allocated' && (!p.supervisor || p.supervisor === 'Unassigned')) return false;
    if (filterAllocation === 'unallocated' && p.supervisor && p.supervisor !== 'Unassigned') return false;
    return true;
  });

  const filteredUsers = allUsers.filter(u => {
    if (userFilterRole !== 'ALL' && u.role !== userFilterRole) return false;
    if (userFilterFaculty !== 'ALL' && u.faculty !== userFilterFaculty) return false;
    if (userFilterBatch !== 'ALL' && u.batch !== userFilterBatch) return false;
    return true;
  });

  // Executive Metric Calculations
  const totalProposals = projects.length;
  const pendingVerificationsCount = allUsers.filter(u => !u.isVerified).length;
  const conflictAlertsCount = projects.filter(p => p.status === 'Flagged Conflict' || p.similarityIndex >= 60).length;
  const activeMentorshipsCount = projects.filter(p => p.supervisor && p.supervisor !== 'Unassigned').length;

  return (
    <div className="space-y-6">
      {/* EXECUTIVE SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Proposals</div>
            <div className="text-2xl font-black text-white mt-1">{totalProposals}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><FileText className="w-5 h-5"/></div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Verifications</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{pendingVerificationsCount}</div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20"><UserCheck className="w-5 h-5"/></div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Conflict Alerts</div>
            <div className="text-2xl font-black text-rose-400 mt-1">{conflictAlertsCount}</div>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20"><AlertTriangle className="w-5 h-5"/></div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Mentorships</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeMentorshipsCount}</div>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><ShieldCheck className="w-5 h-5"/></div>
        </div>
      </div>

      {/* MODERNIZED TAB NAVIGATION */}
      <div className="flex gap-2 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 p-1.5 rounded-2xl w-fit shadow-xl">
        <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'feed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
          <FileText className="w-3.5 h-3.5"/> Proposals
        </button>
        <button onClick={() => setActiveTab('kanban')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'kanban' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
          <Layout className="w-3.5 h-3.5"/> Pipeline
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
          <Users className="w-3.5 h-3.5"/> Users Directory
          {pendingVerificationsCount > 0 && <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[9px] rounded-full">{pendingVerificationsCount}</span>}
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}>
          <BarChart2 className="w-3.5 h-3.5"/> Analytics
        </button>
      </div>

      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 backdrop-blur-xl p-5 border border-slate-800/80 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">Department Roster</h2>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-indigo-400 ml-1" />
              <select value={filterAllocation} onChange={e => setFilterAllocation(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none font-bold text-indigo-400 cursor-pointer">
                <option value="ALL">All Allocations</option>
                <option value="allocated">Allocated Projects</option>
                <option value="unallocated">Unallocated Projects</option>
              </select>

              <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none cursor-pointer">
                <option value="ALL">All Faculties</option>
                <option value="BCA">BCA</option>
                <option value="BSC.CSIT">BSc.CSIT</option>
                <option value="BIT">BIT</option>
              </select>

              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none cursor-pointer">
                <option value="ALL">All Batches</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 border-dashed">No projects found matching the selected filters.</div>
          ) : filteredProjects.map(p => (
            <div key={p._id} className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl space-y-4 transition duration-200 shadow-xl">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">{p.domain}</span>
                    <span className="px-2.5 py-0.5 bg-slate-800/80 text-slate-300 rounded-md text-[10px] font-bold border border-slate-700/50">{p.faculty} • {p.batch}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg tracking-tight pt-1">{p.title}</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit border ${p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>{p.status}</span>
                  {p.status !== 'Approved' && (
                    <button onClick={() => deleteProject(p._id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-xs text-rose-400 rounded-xl font-bold transition flex items-center gap-1 border border-rose-500/20">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">{p.abstract}</p>

              {p.documents && p.documents.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-2">
                  {p.documents.map((doc, idx) => (
                    <a key={idx} href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-indigo-400 text-[11px] font-bold rounded-xl hover:border-indigo-500/40 transition shadow-sm">
                      <Paperclip className="w-3.5 h-3.5" /> {doc.name || `File ${idx + 1}`}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-800/80 text-slate-400 font-bold gap-2">
                <span>Team: <strong className="text-slate-200">{p.teamMembers ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</strong></span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Guide:</span>
                  <select value={p.supervisor} onChange={(e) => assignSupervisor(p._id, e.target.value)} className="bg-slate-950 border border-indigo-500/50 text-indigo-300 px-3 py-1.5 rounded-xl outline-none cursor-pointer font-bold transition">
                    <option value="Unassigned">Unassigned</option>
                    {supervisorsList.map(sup => (
                      <option key={sup._id} value={sup.name}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border ${p.similarityIndex >= 60 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{p.similarityIndex}% Match Index</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['Under Review', 'Flagged Conflict', 'Approved', 'Rejected'].map(statusColumn => (
            <div key={statusColumn} className="bg-slate-900/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 min-h-[500px]">
              <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>{statusColumn}</span>
                <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded-lg text-[10px]">{filteredProjects.filter(p => p.status === statusColumn).length}</span>
              </h3>
              <div className="space-y-3">
                {filteredProjects.filter(p => p.status === statusColumn).map(p => (
                  <div key={p._id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-xl space-y-2 hover:border-indigo-500/50 transition">
                    <div className="text-[9px] font-bold text-indigo-400 tracking-wider uppercase">{p.faculty} • {p.batch}</div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{p.title}</h4>
                    <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-900">{p.teamMembers ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 backdrop-blur-xl p-5 border border-slate-800/80 rounded-2xl shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400">System Users Directory</h2>
            <div className="flex flex-wrap items-center gap-2 bg-slate-950 border border-slate-800 p-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-indigo-400 ml-1" />
              <select value={userFilterRole} onChange={e => setUserFilterRole(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none cursor-pointer">
                <option value="ALL">All Roles</option>
                <option value="student">Students</option>
                <option value="supervisor">Supervisors</option>
                <option value="admin">Admins</option>
              </select>
              <select value={userFilterFaculty} onChange={e => setUserFilterFaculty(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none cursor-pointer">
                <option value="ALL">All Faculties</option>
                <option value="BCA">BCA</option>
                <option value="BSC.CSIT">BSc.CSIT</option>
                <option value="BIT">BIT</option>
              </select>
              <select value={userFilterBatch} onChange={e => setUserFilterBatch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white outline-none cursor-pointer">
                <option value="ALL">All Batches</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Faculty / Batch</th>
                  <th className="p-4 font-bold">Associated Projects</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map(u => {
                  const userProjects = projects.filter(p => 
                    u.role === 'student' ? (p.studentEmail === u.email || p.teamMembers?.some(m => m.email === u.email)) : (p.supervisor === u.name)
                  );

                  const isExpanded = expandedUserId === u._id;

                  return (
                    <React.Fragment key={u._id}>
                      <tr className="hover:bg-slate-900/40 transition">
                        <td className="p-4 font-bold text-white flex items-center gap-2">
                          {u.name}
                          {!u.isVerified && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md text-[9px] font-bold border border-amber-500/20">Pending</span>}
                        </td>
                        <td className="p-4 text-slate-400">{u.email}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : u.role === 'supervisor' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{u.role}</span></td>
                        <td className="p-4 text-slate-300 font-semibold">{u.faculty ? `${u.faculty} (${u.batch})` : '—'}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setExpandedUserId(isExpanded ? null : u._id)}
                            className="text-indigo-400 font-bold hover:underline flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-sm"
                          >
                            <span>{userProjects.length} Project(s)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                          </button>
                        </td>
                        <td className="p-4 space-x-2">
                          <button onClick={() => verifyUser(u._id)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition ${u.isVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                            {u.isVerified ? 'Verified' : 'Verify'}
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u._id)} className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-[10px] font-bold border border-rose-500/20">Remove</button>
                          )}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-950/90">
                          <td colSpan="6" className="p-4">
                            <div className="pl-6 space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Associated Project List & Status</h4>
                              {userProjects.length === 0 ? (
                                <div className="text-slate-500 text-xs italic">No active project assignments found for this user.</div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {userProjects.map(proj => (
                                    <div 
                                      key={proj._id} 
                                      onClick={() => setSelectedProjectModal(proj)}
                                      className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-indigo-500 transition shadow-md"
                                    >
                                      <div>
                                        <div className="text-white font-bold text-xs hover:underline">{proj.title}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-semibold">{proj.faculty} • {proj.batch}</div>
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${proj.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : proj.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                        {proj.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 h-80 shadow-xl">
            <h3 className="text-sm font-bold mb-4 text-center uppercase tracking-wider text-slate-300">Projects by Domain Track</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.domains} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                  {stats.domains.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 h-80 shadow-xl">
            <h3 className="text-sm font-bold mb-4 text-center uppercase tracking-wider text-slate-300">Submission Status Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statuses}>
                <XAxis dataKey="_id" tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}}/>
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedProjectModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase text-indigo-400 font-bold tracking-wider">{selectedProjectModal.domain}</span>
                <h3 className="text-base font-bold text-white mt-0.5 tracking-tight">{selectedProjectModal.title}</h3>
              </div>
              <button onClick={() => setSelectedProjectModal(null)} className="p-1.5 hover:bg-slate-800 text-slate-400 rounded-xl transition">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl text-xs space-y-2.5 border border-slate-800">
              <div><strong className="text-slate-400">Status:</strong> <span className="text-indigo-400 font-bold">{selectedProjectModal.status}</span></div>
              <div><strong className="text-slate-400">Milestone Stage:</strong> <span className="text-emerald-400 font-bold">{selectedProjectModal.progressMilestone || 'In Progress'}</span></div>
              <div><strong className="text-slate-400">Project Partner / Team:</strong> <span className="text-slate-200">{selectedProjectModal.teamMembers ? selectedProjectModal.teamMembers.map(m => m.name).join(', ') : selectedProjectModal.studentName}</span></div>
              <div><strong className="text-slate-400">Assigned Supervisor:</strong> <span className="text-slate-200">{selectedProjectModal.supervisor}</span></div>
              <div><strong className="text-slate-400">Faculty Cohort:</strong> <span className="text-slate-200">{selectedProjectModal.faculty} • Batch {selectedProjectModal.batch}</span></div>
              <div className="pt-2 border-t border-slate-800 text-slate-300 leading-relaxed"><strong className="text-slate-400 block mb-1 uppercase text-[10px] tracking-wider">Abstract:</strong> {selectedProjectModal.abstract}</div>
            </div>

            <button onClick={() => setSelectedProjectModal(null)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-xs font-bold text-white transition shadow-lg shadow-indigo-600/20">
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}