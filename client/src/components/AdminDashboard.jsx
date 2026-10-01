import React, { useState } from 'react';
import { FileText, BarChart2, Layout, Users, Trash2, Filter, Paperclip, ExternalLink, X, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#dc2626', '#059669', '#2563eb', '#d97706', '#7c3aed'];

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

  const totalProposals = projects.length;
  const pendingVerificationsCount = allUsers.filter(u => !u.isVerified).length;
  const conflictAlertsCount = projects.filter(p => p.status === 'Flagged Conflict' || p.similarityIndex >= 60).length;
  const activeMentorshipsCount = projects.filter(p => p.supervisor && p.supervisor !== 'Unassigned').length;

  return (
    <div className="space-y-6">
      {/* Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Proposals</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalProposals}</div>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100"><FileText className="w-5 h-5"/></div>
        </div>

        <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-amber-50 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Pending Verifications</div>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendingVerificationsCount}</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"><UserCheck className="w-5 h-5"/></div>
        </div>

        <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-rose-50 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conflict Alerts</div>
            <div className="text-2xl font-black text-rose-600 mt-1">{conflictAlertsCount}</div>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100"><AlertTriangle className="w-5 h-5"/></div>
        </div>

        <div className="bg-white backdrop-blur-xl border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-28 h-28 bg-emerald-50 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Mentorships</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">{activeMentorshipsCount}</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><ShieldCheck className="w-5 h-5"/></div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-white backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl w-fit shadow-sm print:hidden">
        <button onClick={() => setActiveTab('feed')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'feed' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
          <FileText className="w-3.5 h-3.5"/> Proposals
        </button>
        <button onClick={() => setActiveTab('kanban')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'kanban' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
          <Layout className="w-3.5 h-3.5"/> Pipeline
        </button>
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'users' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
          <Users className="w-3.5 h-3.5"/> Users Directory
          {pendingVerificationsCount > 0 && <span className="px-1.5 py-0.2 bg-amber-500 text-white font-black text-[9px] rounded-full">{pendingVerificationsCount}</span>}
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${activeTab === 'analytics' ? 'bg-red-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
          <BarChart2 className="w-3.5 h-3.5"/> Analytics
        </button>
      </div>

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white print:bg-transparent backdrop-blur-xl p-5 border border-slate-200 print:border-black rounded-2xl shadow-sm print:shadow-none">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600 print:text-black">Department Roster</h2>
            
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs print:hidden">
              <Filter className="w-3.5 h-3.5 text-red-600 ml-1" />
              <select value={filterAllocation} onChange={e => setFilterAllocation(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none font-bold text-red-600 cursor-pointer">
                <option value="ALL">All Allocations</option>
                <option value="allocated">Allocated Projects</option>
                <option value="unallocated">Unallocated Projects</option>
              </select>

              <select value={filterFaculty} onChange={e => setFilterFaculty(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none cursor-pointer">
                <option value="ALL">All Faculties</option>
                <option value="BCA">BCA</option>
                <option value="BSC.CSIT">BSc.CSIT</option>
                <option value="BIT">BIT</option>
              </select>

              <select value={filterBatch} onChange={e => setFilterBatch(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none cursor-pointer">
                <option value="ALL">All Batches</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="p-16 text-center text-slate-500 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 border-dashed print:hidden">No projects found matching the selected filters.</div>
          ) : filteredProjects.map(p => (
            <div key={p._id} className="p-6 bg-white print:bg-transparent backdrop-blur-xl border border-slate-200 print:border-black hover:border-red-300 rounded-2xl space-y-4 transition duration-200 shadow-sm print:shadow-none break-inside-avoid">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase text-red-600 print:text-black font-bold tracking-wider bg-red-50 print:bg-transparent px-2.5 py-0.5 rounded-md border border-red-200 print:border-black">{p.domain}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 print:bg-transparent text-slate-600 print:text-black rounded-md text-[10px] font-bold border border-slate-200 print:border-black">{p.faculty} • {p.batch}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 print:text-black text-lg tracking-tight pt-1">{p.title}</h3>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold h-fit border ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 print:border-black print:text-black' : p.status === 'Flagged Conflict' ? 'bg-red-50 text-red-600 border-red-200 print:border-black print:text-black' : 'bg-amber-50 text-amber-600 border-amber-200 print:border-black print:text-black'}`}>{p.status}</span>
                  {p.status !== 'Approved' && (
                    <button onClick={() => deleteProject(p._id)} className="print:hidden px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-xs text-rose-600 rounded-xl font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600 print:text-black leading-relaxed bg-slate-50 print:bg-transparent p-3.5 rounded-xl border border-slate-200 print:border-none">{p.abstract}</p>

              {p.documents && p.documents.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-2 print:hidden">
                  {p.documents.map((doc, idx) => (
                    <a key={idx} href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-red-600 text-[11px] font-bold rounded-xl hover:border-red-300 transition shadow-sm">
                      <Paperclip className="w-3.5 h-3.5" /> {doc.name || `File ${idx + 1}`}
                    </a>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-200 print:border-black text-slate-500 print:text-black font-bold gap-2">
                <span>Team: <strong className="text-slate-800 print:text-black">{p.teamMembers && p.teamMembers.length > 0 ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</strong></span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 print:text-black">Guide:</span>
                  <select value={p.supervisor} onChange={(e) => assignSupervisor(p._id, e.target.value)} className="bg-white print:bg-transparent border border-red-200 print:border-none text-red-600 print:text-black px-3 py-1.5 rounded-xl outline-none cursor-pointer font-bold transition print:appearance-none">
                    <option value="Unassigned">Unassigned</option>
                    {supervisorsList.map(sup => (
                      <option key={sup._id} value={sup.name}>{sup.name}</option>
                    ))}
                  </select>
                </div>
                <span className={`px-2.5 py-1 rounded-lg border ${p.similarityIndex >= 60 ? 'bg-red-50 text-red-600 border-red-200 print:border-black print:text-black' : 'bg-emerald-50 text-emerald-600 border-emerald-200 print:border-black print:text-black'}`}>{p.similarityIndex}% Match Index</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kanban Tab */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 print:hidden">
          {['Under Review', 'Flagged Conflict', 'Approved', 'Rejected'].map(statusColumn => (
            <div key={statusColumn} className="bg-slate-50/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 min-h-[500px]">
              <h3 className="text-xs font-bold mb-4 uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>{statusColumn}</span>
                <span className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10px]">{filteredProjects.filter(p => p.status === statusColumn).length}</span>
              </h3>
              <div className="space-y-3">
                {filteredProjects.filter(p => p.status === statusColumn).map(p => (
                  <div key={p._id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 hover:border-red-300 transition">
                    <div className="text-[9px] font-bold text-red-600 tracking-wider uppercase">{p.faculty} • {p.batch}</div>
                    <h4 className="text-xs font-bold text-slate-900 tracking-tight">{p.title}</h4>
                    <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">{p.teamMembers && p.teamMembers.length > 0 ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Directory Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white backdrop-blur-xl p-5 border border-slate-200 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-wider text-red-600">System Users Directory</h2>
            <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs">
              <Filter className="w-3.5 h-3.5 text-red-600 ml-1" />
              <select value={userFilterRole} onChange={e => setUserFilterRole(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none cursor-pointer">
                <option value="ALL">All Roles</option>
                <option value="student">Students</option>
                <option value="supervisor">Supervisors</option>
                <option value="admin">Admins</option>
              </select>
              <select value={userFilterFaculty} onChange={e => setUserFilterFaculty(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none cursor-pointer">
                <option value="ALL">All Faculties</option>
                <option value="BCA">BCA</option>
                <option value="BSC.CSIT">BSc.CSIT</option>
                <option value="BIT">BIT</option>
              </select>
              <select value={userFilterBatch} onChange={e => setUserFilterBatch(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 outline-none cursor-pointer">
                <option value="ALL">All Batches</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>

          <div className="bg-white backdrop-blur-xl border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-bold">Name</th>
                  <th className="p-4 font-bold">Email</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold">Faculty / Batch</th>
                  <th className="p-4 font-bold">Associated Projects</th>
                  <th className="p-4 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const userProjects = projects.filter(p => 
                    u.role === 'student' ? (p.studentEmail === u.email || p.teamMembers?.some(m => m.email === u.email)) : (p.supervisor === u.name)
                  );
                  const isExpanded = expandedUserId === u._id;

                  return (
                    <React.Fragment key={u._id}>
                      <tr className="hover:bg-slate-50 transition">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                          {u.name}
                          {!u.isVerified && <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-bold border border-amber-200">Pending</span>}
                        </td>
                        <td className="p-4 text-slate-600">{u.email}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-200' : u.role === 'supervisor' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>{u.role}</span></td>
                        <td className="p-4 text-slate-700 font-semibold">{u.faculty ? `${u.faculty} (${u.batch})` : '—'}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setExpandedUserId(isExpanded ? null : u._id)}
                            className="text-red-600 font-bold hover:bg-red-50 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
                          >
                            <span>{userProjects.length} Project(s)</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
                          </button>
                        </td>
                        <td className="p-4 space-x-2">
                          <button onClick={() => verifyUser(u._id)} className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition cursor-pointer ${u.isVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
                            {u.isVerified ? 'Verified' : 'Verify'}
                          </button>
                          {u.role !== 'admin' && (
                            <button onClick={() => deleteUser(u._id)} className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-bold border border-rose-200 transition cursor-pointer">Remove</button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan="6" className="p-4">
                            <div className="pl-6 space-y-2">
                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Associated Project List & Status</h4>
                              {userProjects.length === 0 ? (
                                <div className="text-slate-500 text-xs italic">No active project assignments found for this user.</div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {userProjects.map(proj => (
                                    <div 
                                      key={proj._id} 
                                      onClick={() => setSelectedProjectModal(proj)}
                                      className="bg-white border border-slate-200 p-3.5 rounded-2xl flex justify-between items-center cursor-pointer hover:border-red-300 transition shadow-sm"
                                    >
                                      <div>
                                        <div className="text-slate-900 font-bold text-xs hover:underline">{proj.title}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5 font-semibold">{proj.faculty} • {proj.batch}</div>
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${proj.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : proj.status === 'Flagged Conflict' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
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

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <div className="bg-white backdrop-blur-xl p-6 rounded-2xl border border-slate-200 h-80 shadow-sm">
            <h3 className="text-sm font-bold mb-4 text-center uppercase tracking-wider text-slate-800">Projects by Domain Track</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.domains} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={80} label>
                  {stats.domains.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white backdrop-blur-xl p-6 rounded-2xl border border-slate-200 h-80 shadow-sm">
            <h3 className="text-sm font-bold mb-4 text-center uppercase tracking-wider text-slate-800">Submission Status Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.statuses}>
                <XAxis dataKey="_id" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px'}}/>
                <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}