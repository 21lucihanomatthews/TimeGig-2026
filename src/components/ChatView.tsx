import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Users, X, Phone, Check, ArrowLeft, Smile, CheckCheck, Plus, Mic, Trash2 } from 'lucide-react';
import { ChatMessage } from '@/src/types';

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🎉', '😢', '😍', '🤔', '🙏', '💯'];

const MOCK_CONTACTS = [
  { id: 1, name: 'Alex Johnson', phone: '+1 (555) 123-4567', isUsingApp: true, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Maria Garcia', phone: '+1 (555) 987-6543', isUsingApp: true, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'James Smith', phone: '+1 (555) 456-7890', isUsingApp: true, avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Linda Martinez', phone: '+1 (555) 234-5678', isUsingApp: false, avatar: 'https://i.pravatar.cc/150?u=4' },
  { id: 5, name: 'Robert Wilson', phone: '+1 (555) 876-5432', isUsingApp: true, avatar: 'https://i.pravatar.cc/150?u=5' },
  { id: 6, name: 'Emma Brown', phone: '+1 (555) 345-6789', isUsingApp: false, avatar: 'https://i.pravatar.cc/150?u=6' },
];

export function ChatView() {
  const [activeContactId, setActiveContactId] = useState<number>(MOCK_CONTACTS[0].id);
  const [chatHistories, setChatHistories] = useState<Record<number, ChatMessage[]>>({});
  const [input, setInput] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [invited, setInvited] = useState<Record<number, boolean>>({});
  const [showEmojis, setShowEmojis] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string, type: 'image' | 'video' | 'audio' } | null>(null);
  const [fullScreenMedia, setFullScreenMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeMessages = chatHistories[activeContactId] || [];
  const activeContact = MOCK_CONTACTS.find(c => c.id === activeContactId);

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

  const handleSend = () => {
    if (!input.trim() && !attachment) return;

    const newMsg: ChatMessage = { 
      role: 'user', 
      content: input, 
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

    // Simulate reply
    setTimeout(() => {
      setChatHistories(prev => {
        const history = prev[activeContactId] || [];
        const updatedHistory = history.map(m => m.role === 'user' ? { ...m, status: 'read' as const } : m);
        return {
          ...prev,
          [activeContactId]: [...updatedHistory, {
            role: 'model',
            content: `Hi, this is a simulated reply from ${activeContact?.name?.split(' ')[0]}. I got your message!`,
            timestamp: Date.now()
          }]
        };
      });
    }, 1000);
  };

  const handleContactClick = (contact: typeof MOCK_CONTACTS[0]) => {
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

  const appUsers = MOCK_CONTACTS.filter(c => c.isUsingApp);

  return (
    <div className="flex flex-col h-full bg-gray-50 pt-4 relative">
      <div className="flex justify-between items-center mb-4 px-4">
        <div className="flex items-center gap-2">
          <img src={activeContact?.avatar} alt={activeContact?.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
          <div className="font-semibold text-gray-800">
            {activeContact?.name}
          </div>
        </div>
        <button 
          onClick={() => setShowContacts(true)}
          className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-blue-600 font-medium hover:bg-blue-50 border border-blue-100 transition-colors"
        >
          <Users size={18} />
          <span>Contacts</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar px-4 pb-20">
        {activeMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 h-full mt-10">
            <img src={activeContact?.avatar} alt={activeContact?.name} className="w-20 h-20 rounded-full mb-4 opacity-50 grayscale" />
            <p className="text-lg font-medium text-gray-700">Say hi to {activeContact?.name}</p>
            <p className="text-sm">Send a message to start the conversation.</p>
          </div>
        )}
        {activeMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl flex gap-3 ${
              msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
            }`}>
              {msg.role === 'model' && (
                  <img src={activeContact?.avatar} alt="" className="w-6 h-6 rounded-full mt-0.5 object-cover" />
              )}
              <div className="flex flex-col gap-2">
                {msg.mediaUrl && (
                  <div className="w-full max-w-sm">
                    {msg.mediaType === 'video' ? (
                      <div className="relative group cursor-pointer" onClick={() => setFullScreenMedia({ url: msg.mediaUrl!, type: 'video' })}>
                        <video src={msg.mediaUrl} className="rounded-xl w-full max-h-60 object-cover bg-black" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                          <div className="bg-white/90 rounded-full w-12 h-12 flex items-center justify-center pl-1 shadow-lg">
                            <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-blue-600 border-b-8 border-b-transparent" />
                          </div>
                        </div>
                      </div>
                    ) : msg.mediaType === 'audio' ? (
                      <audio src={msg.mediaUrl} controls className={`w-full min-w-[250px] sm:min-w-[300px] h-12 rounded-full ${msg.role === 'user' ? 'opacity-90 grayscale-[0.2]' : ''}`} />
                    ) : (
                      <img 
                        src={msg.mediaUrl} 
                        alt="attachment" 
                        onClick={() => setFullScreenMedia({ url: msg.mediaUrl!, type: 'image' })}
                        className="rounded-xl w-full max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                      />
                    )}
                  </div>
                )}
                {msg.content && <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>}
                {msg.role === 'user' && msg.status && (
                  <div className="flex justify-end mt-1 items-center gap-1">
                    <span className="text-[10px] text-blue-200 uppercase tracking-widest">{msg.status}</span>
                    {msg.status === 'read' ? <CheckCheck size={12} className="text-white" /> : <Check size={12} className="text-blue-200" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="h-32 w-full flex-shrink-0" />
      </div>
      
      <div className="fixed bottom-20 left-0 right-0 z-40 flex flex-col shadow-[0_-4px_15px_-5px_rgba(0,0,0,0.05)]">
        {attachment && (
          <div className="bg-white border-t border-gray-100 p-3 flex gap-2 overflow-x-auto w-full">
            <div className="relative inline-block shrink-0">
              {attachment.type === 'video' ? (
                <video src={attachment.url} className="h-24 w-auto rounded-lg object-cover bg-black" controls />
              ) : attachment.type === 'audio' ? (
                <div className="h-12 flex items-center px-2 bg-gray-50 rounded-lg">
                  <audio src={attachment.url} controls className="h-10" />
                </div>
              ) : (
                <img src={attachment.url} className="h-24 w-auto rounded-lg object-cover" />
              )}
              <button 
                onClick={() => setAttachment(null)}
                className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full shadow-md w-6 h-6 flex items-center justify-center hover:bg-gray-900 z-10"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white p-3 border-t border-gray-200">
          <div className="bg-gray-100 rounded-full flex items-center p-1 pl-4 relative">
            {!isRecording && (
              <>
                <button 
                  onClick={() => setShowEmojis(!showEmojis)} 
                  className={`mr-2 transition-colors ${showEmojis ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Smile size={24} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus size={24} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*,video/*,audio/*"
                  className="hidden" 
                />
                
                {showEmojis && (
                  <div className="absolute bottom-14 left-0 bg-white border border-gray-200 shadow-xl rounded-2xl p-3 grid grid-cols-5 gap-1 z-50 animate-in fade-in slide-in-from-bottom-2">
                    {EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => handleEmojiClick(emoji)}
                        className="text-2xl hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-2 h-10">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-[pulse_1s_ease-in-out_infinite]" />
                  <span className="text-red-500 font-medium text-sm tabular-nums">{formatTime(recordingTime)}</span>
                </div>
                <button onClick={cancelRecording} className="text-gray-400 hover:text-gray-600 transition-colors px-2">
                  <Trash2 size={20} />
                </button>
              </div>
            ) : (
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder={`Message ${activeContact?.name?.split(' ')[0]}...`}
                className="flex-1 bg-transparent border-none focus:outline-none py-2 w-0 block"
              />
            )}

            {!input.trim() && !attachment && !isRecording ? (
              <button 
                onClick={startRecording} 
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 ml-2 shrink-0 transition-all hover:scale-105 active:scale-95"
              >
                <Mic size={18} />
              </button>
            ) : isRecording ? (
              <button 
                onClick={stopRecording} 
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 ml-2 shrink-0 transition-all hover:scale-105 active:scale-95"
              >
                <Check size={18} />
              </button>
            ) : (
              <button 
                onClick={handleSend} 
                className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 disabled:opacity-50 ml-2 shrink-0 transition-all hover:scale-105 active:scale-95" 
                disabled={!input.trim() && !attachment}
              >
                <Send size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {fullScreenMedia && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur flex items-center justify-center p-4">
          <button 
            onClick={() => setFullScreenMedia(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all z-50"
          >
            <X size={32} />
          </button>
          
          {fullScreenMedia.type === 'video' ? (
            <video 
              src={fullScreenMedia.url} 
              autoPlay 
              controls 
              className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-95 duration-200" 
            />
          ) : (
            <img 
              src={fullScreenMedia.url} 
              alt="fullscreen" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg animate-in zoom-in-95 duration-200" 
            />
          )}
        </div>
      )}

      {showContacts && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[80vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in duration-300">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Your Contacts</h2>
                <p className="text-sm text-gray-500">{appUsers.length} using App</p>
              </div>
              <button 
                onClick={() => setShowContacts(false)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {MOCK_CONTACTS.map(contact => (
                <div 
                  key={contact.id} 
                  onClick={() => handleContactClick(contact)}
                  className={`bg-white p-3 rounded-2xl border flex items-center gap-4 transition-all cursor-pointer ${
                    activeContactId === contact.id ? 'border-blue-500 ring-1 ring-blue-500 shadow-md' : 'border-gray-100 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div className="relative">
                    <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                    {contact.isUsingApp && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${activeContactId === contact.id ? 'text-blue-700' : 'text-gray-800'}`}>{contact.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                      <Phone size={12} />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                  <div>
                    {contact.isUsingApp ? (
                      <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                        Chat
                      </span>
                    ) : invited[contact.id] ? (
                      <span className="text-xs font-medium bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1">
                        <Check size={12} /> Invited
                      </span>
                    ) : (
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded-full border border-gray-200">
                        Invite
                      </span>
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
