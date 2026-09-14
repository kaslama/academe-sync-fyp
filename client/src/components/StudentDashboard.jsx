import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Trash2, MessageSquare, ExternalLink, Plus, Sparkles, FolderGit2 } from 'lucide-react';

export default function StudentDashboard({ currentUser, token, projects, loadData, SERVER_URL, API }) {
  const [form, setForm] = useState({ title: '', domain: 'Distributed Systems', abstract: '', partnerEmail: '', document: null });
  const [similarity, setSimilarity] = useState({ similarityIndex: 0, flagged: false, matchingTitle: '' });
  const [commentText, setCommentText] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [linkForms, setLinkForms] = useState({});

  const getHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` });

  const formatExternalUrl = (url) => {
    if (!url) return '#';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (form.title.length > 2) {
        try {
          const res = await fetch(`${API}/projects/analyze`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ title: form.title })
          });
          if (res.ok) {
            setSimilarity(await res.json());
          }
        } catch(e) {}
      } else { 
        setSimilarity({ similarityIndex: 0, flagged: false, matchingTitle: '' }); 
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.title]);

  const submitProposal = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('domain', form.domain);
    formData.append('abstract', form.abstract);
    formData.append('partnerEmail', form.partnerEmail);
    formData.append('similarityIndex', similarity.similarityIndex || 0);
    if (form.document) formData.append('document', form.document);

    try {
      const res = await fetch(`${API}/projects`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit proposal.');
        return;
      }
      
      setForm({ title: '', domain: 'Distributed Systems', abstract: '', partnerEmail: '', document: null });
      setSimilarity({ similarityIndex: 0, flagged: false, matchingTitle: '' });
      
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      loadData();
    } catch (err) {
      setSubmitError('Network error during submission.');
    }
  };

  const uploadExistingProjectDocument = async (projectId, file, inputElement) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('document', file);
    await fetch(`${API}/projects/${projectId}/document`, { 
      method: 'POST', 
      headers: { 'Authorization': `Bearer ${token}` }, 
      body: formData 
    });
    if (inputElement) inputElement.value = '';
    loadData();
  };

  const removeDocument = async (projectId, fileUrl) => {
    if (!window.confirm("Are you sure you want to remove this file?")) return;
    const filename = fileUrl.split('/').pop();
    await fetch(`${API}/projects/${projectId}/document/${filename}`, { method: 'DELETE', headers: getHeaders() });
    loadData();
  };

  const addProjectLink = async (projectId) => {
    const linkData = linkForms[projectId];
    if (!linkData || !linkData.title || !linkData.url) return;

    const formattedUrl = formatExternalUrl(linkData.url);

    await fetch(`${API}/projects/${projectId}/links`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title: linkData.title, url: formattedUrl })
    });

    setLinkForms({ ...linkForms, [projectId]: { title: '', url: '' } });
    loadData();
  };

  const removeProjectLink = async (projectId, linkId) => {
    if (!window.confirm("Remove this link?")) return;
    await fetch(`${API}/projects/${projectId}/links/${linkId}`, {
      method: 'DELETE',
      headers: getHeaders()
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Submission Panel */}
      <section className="lg:col-span-4 bg-slate-900/80 backdrop-blur-xl p-6 border border-slate-800/80 rounded-2xl space-y-5 h-fit relative overflow-hidden shadow-2xl shadow-indigo-950/20">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-white">Submit Capstone Proposal</h2>
        </div>

        {submitError && <div className="p-3 bg-rose-500/10 text-rose-400 text-xs rounded-xl font-bold border border-rose-500/20">{submitError}</div>}
        
        <form onSubmit={submitProposal} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Project Title</label>
            <input 
              type="text" 
              placeholder="Enter title" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 p-3 rounded-xl text-white outline-none transition duration-200" 
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Domain Track</label>
            <select 
              value={form.domain} 
              onChange={e => setForm({...form, domain: e.target.value})} 
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 p-3 rounded-xl text-white outline-none transition duration-200"
            >
              <option>Distributed Systems</option>
              <option>Machine Learning</option>
              <option>Cybersecurity</option>
              <option>Web Development</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Technical Abstract (min 20 characters)</label>
            <textarea 
              placeholder="Abstract & Methodology" 
              rows={4} 
              required 
              value={form.abstract} 
              onChange={e => setForm({...form, abstract: e.target.value})} 
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 p-3 rounded-xl text-white outline-none resize-none transition duration-200" 
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Multi-Member Student Group (Optional)</label>
            <input 
              type="email" 
              placeholder="Partner Institutional Email" 
              value={form.partnerEmail} 
              onChange={e => setForm({...form, partnerEmail: e.target.value})} 
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 p-3 rounded-xl text-white outline-none transition duration-200" 
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Proposal Document (.pdf, .doc, .docx)</label>
            <input 
              id="file-upload"
              type="file" 
              accept=".pdf,.doc,.docx,.zip"
              onChange={e => setForm({...form, document: e.target.files[0]})}
              className="w-full bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 outline-none cursor-pointer transition"
            />
          </div>
          
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5 shadow-inner">
            <div className="flex justify-between font-bold">
              <span className="text-slate-400">Lexical Overlap Index:</span>
              <span className={similarity.flagged ? 'text-rose-400' : 'text-emerald-400'}>{similarity.similarityIndex || 0}%</span>
            </div>
            {similarity.flagged && <div className="text-rose-400 text-[11px] leading-relaxed">Conflict with existing title: "{similarity.matchingTitle}"</div>}
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-indigo-600/20 transition duration-200"
          >
            <Send className="w-4 h-4"/> Transmit Proposal
          </button>
        </form>
      </section>

      {/* Submissions Feed */}
      <section className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-wide">My Submissions</h2>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold text-slate-400">
            {projects.length} Total Registered
          </span>
        </div>
        
        {projects.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-slate-800 border-dashed space-y-2">
            <FolderGit2 className="w-10 h-10 mx-auto text-slate-600 opacity-50" />
            <p className="font-medium">No proposals filed under this student identity.</p>
          </div>
        ) : projects.map(p => (
          <div key={p._id} className="p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl space-y-4 transition duration-200 shadow-xl">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">{p.domain}</span>
                  <span className="px-2.5 py-0.5 bg-slate-800/80 text-slate-300 rounded-md text-[10px] font-bold border border-slate-700/50">{p.faculty} • {p.batch}</span>
                </div>
                <h3 className="font-bold text-white text-base pt-1">{p.title}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide h-fit border ${p.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : p.status === 'Flagged Conflict' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                {p.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">{p.abstract}</p>
            
            {p.documents && p.documents.length > 0 && (
              <div className="pt-2 space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Attached Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {p.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pr-3 shadow-sm">
                      <a href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-indigo-600/10 text-indigo-400 text-[11px] font-bold rounded-lg transition">
                        <Paperclip className="w-3.5 h-3.5" /> 
                        <span className="truncate max-w-[160px]">{doc.name || `File ${idx + 1}`}</span>
                      </a>
                      <button onClick={() => removeDocument(p._id, doc.url)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition" title="Remove File">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.status === 'Approved' && (
              <div className="pt-3 space-y-2.5 border-t border-slate-800/80">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Project Links (GitHub / Deployed App)</h4>
                
                {p.links && p.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.links.map(link => (
                      <div key={link._id} className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <a href={formatExternalUrl(link.url)} target="_blank" rel="noreferrer" className="text-indigo-400 text-xs font-bold hover:underline">
                          {link.title}
                        </a>
                        <button onClick={() => removeProjectLink(p._id, link._id)} className="text-rose-400 hover:text-rose-300 ml-1.5 transition">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input 
                    type="text" 
                    placeholder="Link Title (e.g., GitHub Repo)" 
                    value={linkForms[p._id]?.title || ''}
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...linkForms[p._id], title: e.target.value }})}
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-xs p-2.5 rounded-xl outline-none sm:w-1/3 text-white transition"
                  />
                  <input 
                    type="text" 
                    placeholder="github.com/... or https://..." 
                    value={linkForms[p._id]?.url || ''}
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...linkForms[p._id], url: e.target.value }})}
                    className="bg-slate-950 border border-slate-800 focus:border-indigo-500/80 text-xs p-2.5 rounded-xl outline-none flex-1 text-white transition"
                  />
                  <button onClick={() => addProjectLink(p._id)} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition">
                    <Plus className="w-3.5 h-3.5"/> Add Link
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-800/80 text-slate-400 font-bold gap-2">
              <div className="flex items-center gap-4">
                <span>Team: <span className="text-slate-200">{p.teamMembers ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</span></span>
                <span>Guide: <span className="text-slate-200">{p.supervisor}</span></span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg border ${p.similarityIndex >= 60 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                {p.similarityIndex}% Match Score
              </span>
            </div>

            <div className="pt-3 border-t border-slate-800/80">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5">Attach Final Document / Update File</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e) => uploadExistingProjectDocument(p._id, e.target.files[0], e.target)}
                className="text-[11px] text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer w-full outline-none transition"
              />
            </div>

            <div className="pt-4 space-y-2.5 border-t border-slate-800/80 mt-4">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-indigo-400"/> Feedback Thread</h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {p.comments?.map((c, i) => (
                  <div key={i} className="text-[11px] bg-slate-950 p-2.5 rounded-xl text-slate-300 border border-slate-800/60 leading-relaxed">
                    <strong className="text-indigo-400 font-semibold">{c.author}:</strong> {c.text}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input 
                  type="text" 
                  value={commentText[p._id] || ''} 
                  onChange={e => setCommentText({...commentText, [p._id]: e.target.value})} 
                  placeholder="Add a comment..." 
                  className="flex-1 bg-slate-950 border border-slate-800 text-xs p-2.5 rounded-xl outline-none focus:border-indigo-500 text-white transition"
                />
                <button onClick={() => postComment(p._id)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs rounded-xl font-bold transition shadow-sm">Post</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}