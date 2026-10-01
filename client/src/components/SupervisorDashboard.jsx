import React, { useState } from 'react';
import { Paperclip, MessageSquare, Filter, ExternalLink, ShieldCheck, UserCheck, FolderGit2 } from 'lucide-react';

export default function SupervisorDashboard({ currentUser, token, projects, loadData, SERVER_URL, API }) {
  const [commentText, setCommentText] = useState({});
  const [activeChatProject, setActiveChatProject] = useState(null);
  const [selectedDossierProject, setSelectedDossierProject] = useState(null);

  const [filterFaculty, setFilterFaculty] = useState('ALL');
  const [filterBatch, setFilterBatch] = useState('ALL');

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  const formatExternalUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  const updateStatus = async (id, status) => {
    await fetch(`${API}/projects/${id}`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ status }) 
    });
    loadData();
  };

  const updateMilestone = async (id, progressMilestone) => {
    await fetch(`${API}/projects/${id}`, { 
      method: 'PATCH', 
      headers: getHeaders(), 
      body: JSON.stringify({ progressMilestone }) 
    });
    loadData();
  };

  const postComment = async (id) => {
    if (!commentText[id]) return;
    await fetch(`${API}/projects/${id}/comments`, { 
      method: 'POST', 
      headers: getHeaders(), 
      body: JSON.stringify({ text: commentText[id] }) 
    });
    setCommentText({ ...commentText, [id]: '' });
    loadData();
  };

  const filteredProjects = projects.filter(p => {
    if (filterFaculty !== 'ALL' && p.faculty !== filterFaculty) return false;
    if (filterBatch !== 'ALL' && p.batch !== filterBatch) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white print:hidden backdrop-blur-xl p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-red-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-red-600">Faculty Private Mentorship Workspace</h2>
          </div>
          <p className="text-xs text-slate-500">You are viewing all projects officially allotted to you (<strong className="text-slate-900">{currentUser.name}</strong>) by the Department Chair.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-red-600 ml-1" />
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

      {/* Projects Feed */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 border-dashed space-y-2 print:hidden">
            <FolderGit2 className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
            <p className="font-medium">No projects found matching the selected filters.</p>
          </div>
        ) : filteredProjects.map(p => (
          <div key={p._id} className="p-6 bg-white print:bg-transparent backdrop-blur-xl border border-slate-200 print:border-black hover:border-red-300 rounded-2xl space-y-4 transition duration-200 shadow-sm print:shadow-none break-inside-avoid">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-red-600 print:text-black font-bold bg-red-50 print:bg-transparent px-2.5 py-0.5 rounded-md border border-red-200 print:border-black">{p.domain}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 print:bg-transparent text-slate-600 print:text-black rounded-md text-[10px] font-bold border border-slate-200 print:border-black">{p.faculty} • {p.batch}</span>
                </div>
                <h3 className="font-bold text-slate-900 print:text-black text-lg tracking-tight pt-1">{p.title}</h3>
                <div className="text-xs text-slate-600 print:text-black pt-1 flex flex-wrap items-center gap-2">
                  <span>Candidate: <strong className="text-slate-900 print:text-black">{p.studentName}</strong></span>
                  <span>Team: <strong className="text-slate-900 print:text-black">{p.teamMembers && p.teamMembers.length > 0 ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setActiveChatProject(p)} className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-300 text-red-600 rounded-xl transition print:hidden cursor-pointer" title="Open Discussion Chat">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 print:border-black print:text-black' : p.status === 'Flagged Conflict' ? 'bg-red-50 text-red-600 border-red-200 print:border-black print:text-black' : 'bg-amber-50 text-amber-700 border-amber-300 print:border-black print:text-black'}`}>
                  {p.status}
                </span>
                <button onClick={() => setSelectedDossierProject(p)} className="px-3.5 py-2 bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 text-xs rounded-xl font-bold transition shadow-sm print:hidden cursor-pointer">
                  Defense Dossier
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-700 print:text-black leading-relaxed bg-slate-50 print:bg-transparent p-3.5 rounded-xl border border-slate-200 print:border-none">{p.abstract}</p>
            
            {p.documents && p.documents.length > 0 && (
              <div className="pt-1 flex flex-wrap gap-2 print:hidden">
                {p.documents.map((doc, idx) => (
                  <a key={idx} href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-red-600 text-[11px] font-bold rounded-xl hover:border-red-300 transition shadow-sm">
                    <Paperclip className="w-3.5 h-3.5" /> {doc.name || `File ${idx + 1}`}
                  </a>
                ))}
              </div>
            )}

            {p.links && p.links.length > 0 && (
              <div className="pt-2 space-y-2 print:hidden">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Submitted Project Links</h4>
                <div className="flex flex-wrap gap-2">
                  {p.links.map(link => (
                    <a 
                      key={link._id} 
                      href={formatExternalUrl(link.url)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-red-600 text-xs font-bold hover:border-red-300 transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-200 print:border-black text-slate-600 print:text-black font-bold gap-2">
              <div className="flex items-center gap-2">
                <span className="uppercase text-[10px] text-slate-500 print:text-black">Milestone Stage:</span>
                <select 
                  value={p.progressMilestone || 'In Progress'} 
                  onChange={e => updateMilestone(p._id, e.target.value)} 
                  className="bg-white print:bg-transparent border border-red-200 print:border-none text-red-600 print:text-black px-3 py-1.5 rounded-xl text-xs outline-none font-bold cursor-pointer transition print:appearance-none"
                >
                  <option value="In Progress">⏳ In Progress</option>
                  <option value="Completed">✅ Completed</option>
                </select>
              </div>

              <span className={`px-2.5 py-1 rounded-lg border ${p.similarityIndex >= 60 ? 'bg-red-50 text-red-600 border-red-200 print:border-black print:text-black' : 'bg-emerald-50 text-emerald-700 border-emerald-300 print:border-black print:text-black'}`}>
                {p.similarityIndex}% Match Index
              </span>
            </div>

            {p.status !== 'Approved' && p.status !== 'Rejected' && (
              <div className="flex gap-2.5 pt-1 print:hidden">
                <button onClick={() => updateStatus(p._id, 'Approved')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs text-white rounded-xl font-bold transition shadow-md shadow-emerald-600/20 cursor-pointer">Approve Proposal</button>
                <button onClick={() => updateStatus(p._id, 'Rejected')} className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-xs text-red-700 rounded-xl font-bold transition cursor-pointer">Reject Proposal & Notify Candidate</button>
              </div>
            )}

            <div className="pt-4 space-y-2.5 border-t border-slate-200 print:hidden mt-4">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-red-600"/> Feedback Thread</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {p.comments?.map((c, i) => (
                  <div key={i} className="text-[11px] bg-slate-50 p-2.5 rounded-xl text-slate-800 border border-slate-200 leading-relaxed">
                    <strong className="text-red-600 font-semibold">{c.author}:</strong> {c.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input 
                  type="text" 
                  value={commentText[p._id] || ''} 
                  onChange={e => setCommentText({...commentText, [p._id]: e.target.value})} 
                  placeholder="Add a comment..." 
                  className="flex-1 bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none focus:border-red-500 text-slate-900 transition"
                />
                <button onClick={() => postComment(p._id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl font-bold transition shadow-sm cursor-pointer">Post</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discussion Modal */}
      {activeChatProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wide text-red-600">Discussion: {activeChatProject.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">Use the feedback thread on the project card to transmit real-time comments directly to the student group workspace.</p>
            <button onClick={() => setActiveChatProject(null)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer">Close Window</button>
          </div>
        </div>
      )}

      {/* Defense Dossier Modal */}
      {selectedDossierProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-wide text-red-600">Defense Dossier Summary</h3>
            <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2.5 border border-slate-200">
              <div><strong className="text-slate-600">Title:</strong> <span className="text-slate-900">{selectedDossierProject.title}</span></div>
              <div><strong className="text-slate-600">Domain:</strong> <span className="text-slate-900">{selectedDossierProject.domain}</span></div>
              <div><strong className="text-slate-600">Faculty Cohort:</strong> <span className="text-slate-900">{selectedDossierProject.faculty} - Batch {selectedDossierProject.batch}</span></div>
              <div><strong className="text-slate-600">Similarity Risk Index:</strong> <span className="text-slate-900">{selectedDossierProject.similarityIndex}%</span></div>
              <div><strong className="text-slate-600">Current Standing:</strong> <span className="text-slate-900">{selectedDossierProject.progressMilestone || 'In Progress'}</span></div>
            </div>
            <button onClick={() => setSelectedDossierProject(null)} className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl text-xs font-bold text-white transition shadow-md shadow-red-600/20 cursor-pointer">Dismiss Dossier</button>
          </div>
        </div>
      )}
    </div>
  );
}