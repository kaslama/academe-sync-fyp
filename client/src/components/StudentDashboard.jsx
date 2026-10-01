import React, { useState, useEffect } from 'react';
import { Send, Paperclip, Trash2, MessageSquare, ExternalLink, Plus, Sparkles, FolderGit2 } from 'lucide-react';

export default function StudentDashboard({ currentUser, token, projects, loadData, SERVER_URL, API }) {
  const [form, setForm] = useState({ 
    title: '', 
    domain: 'Distributed Systems', 
    abstract: '', 
    partnerEmail: '', 
    document: null,
    faculty: currentUser?.faculty || 'BCA',
    batch: currentUser?.batch || '2022'
  });
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
            body: JSON.stringify({ title: form.title, abstract: form.abstract })
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
  }, [form.title, form.abstract]);

  const submitProposal = async (e) => {
    e.preventDefault();
    setSubmitError('');

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('domain', form.domain);
    formData.append('abstract', form.abstract);
    
    if (form.partnerEmail && form.partnerEmail.trim() !== '') {
      formData.append('teamMembers', JSON.stringify([{ name: 'Project Partner', email: form.partnerEmail.trim() }]));
    }

    formData.append('similarityIndex', similarity.similarityIndex || similarity.score || 0);
    formData.append('faculty', form.faculty); 
    formData.append('batch', form.batch);     
    
    if (form.document) {
      formData.append('document', form.document);
    }

    try {
      const res = await fetch(`${API}/projects`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || data.message || 'Failed to submit proposal.');
        return;
      }
      
      setForm({ ...form, title: '', abstract: '', partnerEmail: '', document: null });
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
    
    try {
      await fetch(`${API}/projects/${projectId}/document`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` }, 
        body: formData 
      });
      if (inputElement) inputElement.value = '';
      loadData();
    } catch (err) {
      console.error("Failed to upload document", err);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
      {/* Submission Panel */}
      <section className="lg:col-span-4 bg-white print:hidden backdrop-blur-xl p-6 border border-slate-200 rounded-2xl space-y-5 h-fit relative overflow-hidden shadow-sm">
        <div className="absolute -right-12 -top-12 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Sparkles className="w-4 h-4 text-red-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">Submit Capstone Proposal</h2>
        </div>

        {submitError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl font-bold border border-rose-300">{submitError}</div>}
        
        <form onSubmit={submitProposal} className="space-y-4 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Project Title</label>
            <input 
              type="text" 
              placeholder="Enter title" 
              required 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3 rounded-xl text-slate-900 outline-none transition duration-200" 
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Domain Track</label>
            <select 
              value={form.domain} 
              onChange={e => setForm({...form, domain: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3 rounded-xl text-slate-900 outline-none transition duration-200"
            >
              <option>Distributed Systems</option>
              <option>Machine Learning</option>
              <option>Computer Vision</option>
              <option>Cybersecurity</option>
              <option>Web Development</option>
              <option>Cloud</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Technical Abstract (min 20 characters)</label>
            <textarea 
              placeholder="Abstract & Methodology" 
              rows={4} 
              required 
              value={form.abstract} 
              onChange={e => setForm({...form, abstract: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3 rounded-xl text-slate-900 outline-none resize-none transition duration-200" 
            />
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Multi-Member Student Group (Optional)</label>
            <input 
              type="email" 
              placeholder="Partner Institutional Email" 
              value={form.partnerEmail} 
              onChange={e => setForm({...form, partnerEmail: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 p-3 rounded-xl text-slate-900 outline-none transition duration-200" 
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">Proposal Document (.pdf, .doc, .docx)</label>
            <input 
              id="file-upload"
              type="file" 
              accept=".pdf,.doc,.docx,.zip"
              onChange={e => setForm({...form, document: e.target.files[0] || null})}
              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-600 hover:file:bg-red-100 outline-none cursor-pointer transition"
            />
          </div>
          
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-inner">
            <div className="flex justify-between font-bold">
              <span className="text-slate-600">Lexical Overlap Index:</span>
              <span className={similarity.flagged ? 'text-rose-700' : 'text-emerald-700'}>{similarity.similarityIndex || similarity.score || 0}%</span>
            </div>
            {similarity.flagged && <div className="text-rose-700 text-[11px] leading-relaxed">Conflict with existing title: "{similarity.matchingTitle}"</div>}
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] rounded-xl font-bold flex justify-center items-center gap-2 shadow-md shadow-red-600/20 transition duration-200 text-white cursor-pointer"
          >
            <Send className="w-4 h-4"/> Transmit Proposal
          </button>
        </form>
      </section>

      {/* Submissions Feed */}
      <section className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 print:text-black tracking-wide">My Submissions</h2>
          <span className="px-3 py-1 bg-white print:bg-transparent border border-slate-200 print:border-none rounded-full text-xs font-bold text-slate-500 print:text-black shadow-sm print:shadow-none">
            {projects.length} Total Registered
          </span>
        </div>
        
        {projects.length === 0 ? (
          <div className="p-16 text-center text-slate-500 bg-white/40 backdrop-blur-md rounded-2xl border border-slate-200 border-dashed space-y-2 print:hidden">
            <FolderGit2 className="w-10 h-10 mx-auto text-slate-400 opacity-50" />
            <p className="font-medium">No proposals filed under this student identity.</p>
          </div>
        ) : projects.map(p => (
          <div key={p._id} className="p-6 bg-white print:bg-transparent backdrop-blur-xl border border-slate-200 print:border-black hover:border-red-300 rounded-2xl space-y-4 transition duration-200 shadow-sm print:shadow-none break-inside-avoid">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-red-600 print:text-black font-bold bg-red-50 print:bg-transparent px-2.5 py-0.5 rounded-md border border-red-200 print:border-black">{p.domain}</span>
                  <span className="px-2.5 py-0.5 bg-slate-100 print:bg-transparent text-slate-600 print:text-black rounded-md text-[10px] font-bold border border-slate-200 print:border-black">{p.faculty} • {p.batch}</span>
                </div>
                <h3 className="font-bold text-slate-900 print:text-black text-base pt-1">{p.title}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide h-fit border ${p.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 print:border-black print:text-black' : p.status === 'Flagged Conflict' ? 'bg-rose-50 text-rose-700 border-rose-300 print:border-black print:text-black' : 'bg-amber-50 text-amber-700 border-amber-300 print:border-black print:text-black'}`}>
                {p.status}
              </span>
            </div>

            <p className="text-xs text-slate-600 print:text-black leading-relaxed bg-slate-50 print:bg-transparent p-3 rounded-xl border border-slate-200 print:border-none">{p.abstract}</p>
            
            {p.documents && p.documents.length > 0 && (
              <div className="pt-2 space-y-2 print:hidden">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Attached Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {p.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5 pr-3 shadow-sm">
                      <a href={`${SERVER_URL}${doc.url}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-red-50 text-red-600 text-[11px] font-bold rounded-lg transition">
                        <Paperclip className="w-3.5 h-3.5" /> 
                        <span className="truncate max-w-[160px]">{doc.name || `File ${idx + 1}`}</span>
                      </a>
                      <button onClick={() => removeDocument(p._id, doc.url)} className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer" title="Remove File">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.status === 'Approved' && (
              <div className="pt-3 space-y-2.5 border-t border-slate-200 print:hidden">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Project Links (GitHub / Deployed App)</h4>
                
                {p.links && p.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {p.links.map(link => (
                      <div key={link._id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <ExternalLink className="w-3.5 h-3.5 text-red-600" />
                        <a href={formatExternalUrl(link.url)} target="_blank" rel="noreferrer" className="text-red-600 text-xs font-bold hover:underline">
                          {link.title}
                        </a>
                        <button onClick={() => removeProjectLink(p._id, link._id)} className="text-rose-600 hover:text-rose-500 ml-1.5 transition cursor-pointer">
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
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...(linkForms[p._id] || {}), title: e.target.value }})}
                    className="bg-white border border-slate-200 focus:border-red-500 text-xs p-2.5 rounded-xl outline-none sm:w-1/3 text-slate-900 transition"
                  />
                  <input 
                    type="text" 
                    placeholder="github.com/... or https://..." 
                    value={linkForms[p._id]?.url || ''}
                    onChange={e => setLinkForms({...linkForms, [p._id]: { ...(linkForms[p._id] || {}), url: e.target.value }})}
                    className="bg-white border border-slate-200 focus:border-red-500 text-xs p-2.5 rounded-xl outline-none flex-1 text-slate-900 transition"
                  />
                  <button onClick={() => addProjectLink(p._id)} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition cursor-pointer">
                    <Plus className="w-3.5 h-3.5"/> Add Link
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[11px] pt-3 border-t border-slate-200 print:border-black text-slate-500 print:text-black font-bold gap-2">
              <div className="flex items-center gap-4">
                <span>Team: <span className="text-slate-800 print:text-black">{p.teamMembers && p.teamMembers.length > 0 ? p.teamMembers.map(m => m.name).join(', ') : p.studentName}</span></span>
                <span>Guide: <span className="text-slate-800 print:text-black">{p.supervisorName || p.supervisor || 'Unassigned'}</span></span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg border ${p.similarityIndex >= 60 ? 'bg-rose-50 text-rose-700 border-rose-300 print:border-black print:text-black' : 'bg-emerald-50 text-emerald-700 border-emerald-300 print:border-black print:text-black'}`}>
                {p.similarityIndex}% Match Score
              </span>
            </div>

            <div className="pt-3 border-t border-slate-200 print:hidden">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block mb-1.5">Attach Final Document / Update File</label>
              <input 
                type="file" 
                accept=".pdf,.doc,.docx,.zip"
                onChange={(e) => uploadExistingProjectDocument(p._id, e.target.files[0] || null, e.target)}
                className="text-[11px] text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer w-full outline-none transition"
              />
            </div>

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
      </section>
    </div>
  );
}