import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X, Send, MessageSquare } from 'lucide-react';

export default function ProjectChatModal({ project, onClose, onUpdate }) {
  const { user, token } = useContext(AuthContext);
  const [messages, setMessages] = useState(project.messages || []);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${project._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text: text.trim() })
      });

      if (res.ok) {
        const updatedMessages = await res.json();
        setMessages(updatedMessages);
        setText('');
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to transmit message', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[600px] overflow-hidden">
        
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-red-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Project Consultation Channel</h3>
              <p className="text-[10px] text-slate-500 truncate max-w-md">{project.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No consultative messages logged yet. Begin the discussion below.
            </div>
          ) : (
            messages.map((m, i) => {
              const isMe = m.senderId === user.id || m.senderName === user.name;
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">{m.senderName}</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 rounded font-mono text-[9px] uppercase">
                      {m.senderRole}
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div
                    className={`max-w-md p-3 rounded-2xl text-xs ${
                      isMe
                        ? 'bg-red-600 text-white rounded-br-xs shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type guidance, inquiry, or revision note..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 transition"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}