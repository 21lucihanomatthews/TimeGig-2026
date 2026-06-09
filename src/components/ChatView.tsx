import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Users, X, Phone, Check, ArrowLeft, Smile, CheckCheck, Plus, Mic, Trash2, ShieldAlert, Sparkles, CheckCircle, Navigation } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';
import LiveStorageService from '../lib/supabase';

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😢', '😍', '🤔', '🙏', '💯'];

interface Contact {
  id: string | number;
  name: string;
  phone: string;
  isUsingApp: boolean;
  avatar: string;
  isAI?: boolean;
}

interface ChatViewProps {
  isNavbarVisible: boolean;
  setIsNavbarVisible: (visible: boolean) => void;
  profile?: UserProfile;
}

export function ChatView({ isNavbarVisible, setIsNavbarVisible, profile }: ChatViewProps) {
  const [activeContactId, setActiveContactId] = useState<string | number>('100'); // Default to Gemini Assistant
  const [contacts, setContacts] = useState<Contact[]>([
    { id: '100', name: 'TimeGiG Assistant', phone: 'AI Co-Pilot', isUsingApp: true, avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80', isAI: true }
  ]);

  const [chatHistories, setChatHistories] = useState<Record<string | number, ChatMessage[]>>({
    '100': [
      { role: 'model', content: 'Hello! I am your AI TimeGiG Assistant. How can I help you today? I can guide you through securing top-ups, finding trust-worthy helpers, preparing your Matric resume certifications, or managing your digital ledger profits.', timestamp: Date.now() }
    ]
  });

  useEffect(() => {
    async function fetchProfiles() {
      const profiles = await LiveStorageService.getAllProfiles();
      const defaultContacts: Contact[] = [
        { id: '100', name: 'TimeGiG Assistant', phone: 'AI Co-Pilot', isUsingApp: true, avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&q=80', isAI: true }
      ];

      // Exclude current logged in user
      const filteredProfiles = profiles.filter(p => !profile || p.email !== profile.email);

      const dynamicContacts: Contact[] = filteredProfiles.map((p) => ({
        id: p.email,
        name: `${p.name} ${p.surname || ''}`.trim(),
        phone: p.contactInfo || p.email,
        isUsingApp: true,
        avatar: p.facePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      }));

      setContacts([...defaultContacts, ...dynamicContacts]);
    }
    fetchProfiles();
  }, [profile]);

  const [input, setInput] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [invited, setInvited] = useState<Record<string | number, boolean>>({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string, type: 'image' | 'video' | 'audio' } | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const activeMessages = chatHistories[activeContactId] || [];
  const activeContact = contacts.find(c => String(c.id) === String(activeContactId));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeContactId, activeMessages.length, isAiLoading]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAttachment({ url, type: 'audio' });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent generating attachment
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setAttachment({ url, type });
  };

  const handleSend = async () => {
    if (!input.trim() && !attachment) return;

    const userMessageContent = input;
    const isTargetBot = activeContact?.isAI;

    const newMsg: ChatMessage = { 
      role: 'user', 
      content: userMessageContent, 
      timestamp: Date.now(), 
      status: 'sent',
      mediaUrl: attachment?.url,
      mediaType: attachment?.type
    };

    setChatHistories(prev => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), newMsg]
    }));

    setInput('');
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (isTargetBot) {
      setIsAiLoading(true);
      try {
        const res = await fetch('/api/helper', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: userMessageContent })
        });
        
        const data = await res.json();
        const replyText = data.text || "Sorry, I spent a moment looking at my systems but failed to fetch. Please verify that your GEMINI_API_KEY environment variable is configured in the Settings.";
        
        setChatHistories(prev => ({
          ...prev,
          100: [
            ...(prev[100] || []).map(m => m.role === 'user' ? { ...m, status: 'read' as const } : m),
            {
              role: 'model',
              content: replyText,
              timestamp: Date.now()
            }
          ]
        }));
      } catch (err: any) {
        setChatHistories(prev => ({
          ...prev,
          100: [
            ...(prev[100] || []),
            {
              role: 'model',
              content: "I couldn't reach my server. Please make sure that standard dependencies are installed and double-check your API configurations.",
              timestamp: Date.now()
            }
          ]
        }));
      } finally {
        setIsAiLoading(false);
      }
    } else {
      // Simulate slow mock replies for normal users
      setTimeout(() => {
        setChatHistories(prev => {
          const history = prev[activeContactId] || [];
          const updatedHistory = history.map(m => m.role === 'user' ? { ...m, status: 'read' as const } : m);
          return {
            ...prev,
            [activeContactId]: [...updatedHistory, {
              role: 'model',
              content: `Hi there, this is a friendly response from ${activeContact?.name?.split(' ')[0]}. Got your message! Let me review the details on our dashboard.`,
              timestamp: Date.now()
            }]
          };
        });
      }, 1000);
    }
  };

  const handleContactClick = (contact: Contact) => {
    if (contact.isUsingApp) {
      setActiveContactId(contact.id);
      setShowContacts(false);
    } else {
      setInvited(prev => ({ ...prev, [contact.id]: true }));
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojis(false);
  };

  const appUsers = contacts.filter(c => c.isUsingApp);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Upper Chat bar panel */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-rose-100/10 bg-white z-30 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={activeContact?.avatar} alt={activeContact?.name} className="w-11 h-11 rounded-2xl object-cover border border-slate-200" />
            {activeContact?.isAI ? (
              <span className="absolute bottom-0 right-0 p-0.5 bg-blue-600 rounded-lg text-[9px] text-white">
                <Sparkles size={8} />
              </span>
            ) : (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            )}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 leading-none">
              {activeContact?.name}
              {activeContact?.isAI && <span className="text-[9px] bg-blue-50 text-blue-600 font-extrabold px-1.5 py-0.5 rounded-lg border border-blue-100">AI</span>}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold block mt-1">{activeContact?.phone}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isNavbarVisible && (
            <button
              onClick={() => setIsNavbarVisible(true)}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3.5 py-2.5 rounded-xl text-xs font-black border border-blue-100 transition-colors shadow-sm"
              title="Restore main bottom menu"
            >
              <Navigation size={13} className="rotate-90 text-blue-500 fill-blue-500" />
              <span>Show Menu</span>
            </button>
          )}

          <button 
            onClick={() => setShowContacts(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-4 py-2.5 rounded-xl text-slate-700 text-xs font-black transition-colors shadow-sm"
          >
            <Users size={14} />
            <span>Contacts List</span>
          </button>
        </div>
      </div>

      {/* Message history grid */}
      <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4 no-scrollbar">
        {activeMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[78%] p-3.5 rounded-2xl flex gap-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/10' 
                : 'bg-white text-slate-800 shadow-sm border border-slate-150 rounded-bl-none'
            }`}>
              {msg.role === 'model' && (
                <img src={activeContact?.avatar} alt="" className="w-6 h-6 rounded-lg mt-0.5 object-cover" />
              )}
              <div className="flex flex-col gap-1">
                {msg.mediaUrl && (
                  <div className="w-full max-w-sm">
                    {msg.mediaType === 'video' ? (
                      <video src={msg.mediaUrl} className="rounded-xl w-full max-h-48 object-cover bg-black" controls />
                    ) : msg.mediaType === 'audio' ? (
                      <audio src={msg.mediaUrl} controls className="w-full min-w-[200px]" />
                    ) : (
                      <img src={msg.mediaUrl} alt="attachment" className="rounded-xl w-full max-h-48 object-cover cursor-pointer" onClick={() => setFullScreenMedia({ url: msg.mediaUrl!, type: 'image' })} />
                    )}
                  </div>
                )}
                <div className="text-xs font-semibold leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                {msg.role === 'user' && msg.status && (
                  <div className="flex justify-end items-center gap-1 mt-1 text-[8px] text-blue-200">
                    <span className="uppercase tracking-widest">{msg.status}</span>
                    {msg.status === 'read' ? <CheckCheck size={10} className="text-white" /> : <Check size={10} className="text-blue-200" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* AI Processing Bubble */}
        {isAiLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-white text-slate-800 p-3.5 rounded-2xl border border-slate-150 rounded-bl-none flex items-center gap-3">
              <img src={activeContact?.avatar} alt="" className="w-6 h-6 rounded-lg object-cover text-blue-500 animate-spin" />
              <span className="text-xs font-bold text-slate-500">TimeGiG Artificial Intelligence typing...</span>
            </div>
          </div>
        )}

        {/* Anchor for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Dynamic Bottom bar input suite */}
      <div className="flex flex-col bg-white border-t border-slate-100 flex-shrink-0 shadow-lg z-40">
        {attachment && (
          <div className="bg-white border-t border-slate-100 p-3 flex gap-2 overflow-x-auto w-full">
            <div className="relative inline-block shrink-0">
              {attachment.type === 'video' ? (
                <video src={attachment.url} className="h-20 w-auto rounded-xl object-cover bg-black" controls />
              ) : attachment.type === 'audio' ? (
                <div className="h-10 flex items-center px-2 bg-slate-50 rounded-xl">
                  <audio src={attachment.url} controls className="h-8" />
                </div>
              ) : (
                <img src={attachment.url} className="h-20 w-auto rounded-xl object-cover border border-slate-100" />
              )}
              <button 
                onClick={() => setAttachment(null)}
                className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-white text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-black"
              >
                <X size={10} />
              </button>
            </div>
          </div>
        )}

        {/* Input keys */}
        <div className="bg-white p-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl flex items-center p-1.5 pl-4 relative border border-slate-150">
            {!isRecording && (
              <>
                <button 
                  onClick={() => setShowEmojis(!showEmojis)} 
                  className={`mr-2.5 transition-colors ${showEmojis ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Smile size={20} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="mr-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Plus size={20} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,video/*,audio/*"
                  className="hidden" 
                />
                
                {showEmojis && (
                  <div className="absolute bottom-16 left-0 bg-white border border-slate-100 shadow-2xl rounded-2xl p-3 grid grid-cols-5 gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-2">
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-xl hover:bg-slate-50 w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-2 h-9">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-red-650 font-bold text-xs tabular-nums">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={cancelRecording} className="text-slate-400 hover:text-slate-600 transition-colors px-2">
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={`Type message or task details...`}
                className="flex-1 bg-transparent border-none focus:outline-none py-1.5 text-xs font-semibold text-slate-800"
              />
            )}

            {!input.trim() && !attachment && !isRecording ? (
              <button 
                onClick={startRecording} 
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              >
                <Mic size={16} />
              </button>
            ) : isRecording ? (
              <button 
                onClick={stopRecording} 
                className="w-9 h-9 bg-emerald-600 hover:bg-emerald-750 rounded-xl flex items-center justify-center text-white shrink-0"
              >
                <Check size={16} />
              </button>
            ) : (
              <button 
                onClick={handleSend} 
                disabled={!input.trim() && !attachment}
                className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-all"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {fullScreenMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4">
          <button 
            onClick={() => setFullScreenMedia(null)}
            className="absolute top-6 right-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 z-50"
          >
            <X size={24} />
          </button>
          <img src={fullScreenMedia.url} className="max-w-full max-h-[85vh] object-contain rounded-2xl" alt="" />
        </div>
      )}

      {/* Dynamic Slide-in Contacts panel */}
      {showContacts && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900">Platform Contacts</h2>
                <p className="text-xs text-slate-400 font-bold uppercase">{appUsers.length} online helpers</p>
              </div>
              <button 
                onClick={() => setShowContacts(false)}
                className="w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-500"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {contacts.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => handleContactClick(contact)}
                  className={`bg-white p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                    String(activeContactId) === String(contact.id) ? 'border-blue-500 ring-1 ring-blue-500 shadow-sm' : 'border-slate-100 hover:border-slate-250'
                  }`}
                >
                  <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-xl object-cover border border-slate-150" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">{contact.name} {contact.isAI && <Sparkles size={12} className="text-blue-500" />}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold block mt-1">{contact.phone}</p>
                  </div>
                  <div>
                    {contact.isUsingApp ? (
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100 uppercase tracking-widest">Chat</span>
                    ) : invited[contact.id] ? (
                      <span className="text-[10px] font-bold bg-green-50 text-green-600 px-3 py-1.5 rounded-lg border border-green-100 uppercase">Invited</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 uppercase">Invite</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
