import React, { useState, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Clock, DollarSign, Search, Filter, Tag, Plus, X, Video, Send, Trash2, StopCircle, RefreshCw, Calendar, MapPin, Award, CheckCircle2, Sparkles, CheckCircle } from 'lucide-react';
import { Gig } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';
import LiveStorageService from '../lib/supabase';

const INITIAL_GIGS: Gig[] = [
  { 
    id: '1', 
    title: 'Casual Garden Help', 
    description: 'Looking for assistance with garden weeding, pool netting, and backyard watering for 2 hours this weekend. Tools are fully provided at site.', 
    price: '250', 
    category: 'Gardener', 
    status: 'available', 
    employer: 'Alice Smith', 
    image: 'https://images.unsplash.com/photo-1558904541-efa8c3a30fc9?w=500&auto=format&fit=crop&q=80',
    startDate: 'Immediately',
    endDate: '2026-06-15'
  },
  { 
    id: '2', 
    title: 'Weekend Pet Sitting', 
    description: 'Watch over a super friendly, well-behaved golden retriever while I am away on a business itinerary. Must love walks and playing catch.', 
    price: '400', 
    category: 'Pet Sitter', 
    status: 'available', 
    employer: 'Bob Jones', 
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500&auto=format&fit=crop&q=80',
    startDate: '2026-06-13',
    endDate: '2026-06-14'
  },
  { 
    id: '3', 
    title: 'Matric Calculus Tutoring', 
    description: 'Urgent demand for mathematical support to prepare for mid-year examinations. High emphasis on trigonometry, limits, and integral proofs.', 
    price: '300', 
    category: 'Math Tutor', 
    status: 'available', 
    employer: 'Matthews High', 
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=80',
    startDate: '2026-06-10',
    endDate: '2026-06-25'
  }
];

const GIG_CATEGORIES = ['All', 'Gardener', 'Pet Sitter', 'Math Tutor', 'Handyman'];

interface GigsViewProps {
  gigs: Gig[];
  setGigs: React.Dispatch<React.SetStateAction<Gig[]>>;
  onAddNotification?: (title: string, message: string, type: 'gig' | 'promotion' | 'system') => void;
  profile?: any;
}

export function GigsView({ gigs, setGigs, onAddNotification, profile }: GigsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [newGig, setNewGig] = useState<{ title: string; description: string; price: string; images: string[]; startDate: string; endDate: string }>({ title: '', description: '', price: '', images: [], startDate: 'Immediately', endDate: '' });
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isApplying, setIsApplying] = useState(false);
  const [applyText, setApplyText] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);


  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageUrls = files.map((file: File) => URL.createObjectURL(file));
      setNewGig(prev => ({ ...prev, images: [...prev.images, ...imageUrls] }));
    }
  };

  const handleCreateGig = () => {
    if (!newGig.title || !newGig.price) return;
    const gig: Gig = {
      id: Date.now().toString(),
      title: newGig.title,
      description: newGig.description,
      price: newGig.price,
      category: 'Gardener',
      status: 'available',
      employer: 'You',
      images: newGig.images,
      image: newGig.images.length > 0 ? newGig.images[0] : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500',
      startDate: newGig.startDate,
      endDate: newGig.endDate
    };
    setGigs([gig, ...gigs]);
    if (onAddNotification) {
      onAddNotification(
        'New Gig Published',
        `Success! You created the casual task "${gig.title}" with budget R${gig.price}.`,
        'gig'
      );
    }
    setNewGig({ title: '', description: '', price: '', images: [], startDate: 'Immediately', endDate: '' });
    setIsPosting(false);
  };

  const handleDeleteGig = (id: string) => {
    setGigs(gigs.filter(g => g.id !== id));
    handleCloseModal();
  };

  const resetApplication = () => {
    setIsApplying(false);
    setApplyText('');
    setVideoUrl(null);
    closeCamera();
  };

  const handleCloseModal = () => {
    setSelectedGig(null);
    resetApplication();
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
      
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
      }, 50);
    } catch (err) {
      console.error("Camera access error:", err);
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = mediaRecorder;
    videoChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const bgBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(bgBlob);
      setVideoUrl(url);
    };

    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsCameraOpen(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    }
  };

  const closeCamera = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsCameraOpen(false);
    setVideoUrl(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const discardVideo = () => {
    setVideoUrl(null);
  };

  const handleDirectHire = async () => {
    if (!selectedGig) return;
    if (selectedGig.employer === 'You' || (profile?.name && selectedGig.employer === profile.name)) {
      alert("You cannot hire yourself for your own posted gig.");
      return;
    }
    const userEmail = profile?.email || '21lucihanomatthews@gmail.com';

    const updatedGig: Gig = {
      ...selectedGig,
      status: 'active',
      workerEmail: userEmail
    };

    setGigs(prev => prev.map(g => g.id === selectedGig.id ? updatedGig : g));
    setSelectedGig(updatedGig);

    const allHelpers = await LiveStorageService.getHelpers([]);
    const helperProfile = allHelpers.find(h => h.contact === userEmail);
    if (helperProfile) {
      const updatedHelper = {
        ...helperProfile,
        availableNow: false
      };
      await LiveStorageService.saveHelper(updatedHelper);
    }

    if (onAddNotification) {
      onAddNotification(
        'Work Shift Commenced',
        `💼 You have been hired for listed task "${selectedGig.title}"! Your helper dashboard is now set to working mode (booked today).`,
        'system'
      );
    }

    alert('You have successfully accepted the task & entered WORKING mode (booked today)!');
    handleCloseModal();
  };

  const handleCompleteGig = async () => {
    if (!selectedGig) return;
    const userEmail = profile?.email || '21lucihanomatthews@gmail.com';

    const updatedGig: Gig = {
      ...selectedGig,
      status: 'completed'
    };

    setGigs(prev => prev.map(g => g.id === selectedGig.id ? updatedGig : g));
    setSelectedGig(updatedGig);

    const allHelpers = await LiveStorageService.getHelpers([]);
    const helperProfile = allHelpers.find(h => h.contact === userEmail);
    if (helperProfile) {
      const updatedHelper = {
        ...helperProfile,
        availableNow: true,
        completedTasks: (helperProfile.completedTasks || 0) + 1
      };
      await LiveStorageService.saveHelper(updatedHelper);
    }

    if (onAddNotification) {
      onAddNotification(
        'Gig Certified Complete',
        `🎉 Casual task "${selectedGig.title}" successfully completed! Helper profile successfully returned to AVAILABLE.`,
        'system'
      );
    }

    alert('Gig compiled and certified complete! Your helper profile is back to AVAILABLE.');
    handleCloseModal();
  };

  const handleSendApplication = async () => {
    if (!applyText.trim() && !videoUrl) return;
    
    if (selectedGig) {
      if (selectedGig.employer === 'You' || (profile?.name && selectedGig.employer === profile.name)) {
        alert("You cannot apply or hire yourself for your own posted gig.");
        return;
      }
      const userEmail = profile?.email || '21lucihanomatthews@gmail.com';

      const updatedGig: Gig = {
        ...selectedGig,
        status: 'active',
        workerEmail: userEmail
      };

      setGigs(prev => prev.map(g => g.id === selectedGig.id ? updatedGig : g));
      setSelectedGig(updatedGig);

      const allHelpers = await LiveStorageService.getHelpers([]);
      const helperProfile = allHelpers.find(h => h.contact === userEmail);
      if (helperProfile) {
        const updatedHelper = {
          ...helperProfile,
          availableNow: false
        };
        await LiveStorageService.saveHelper(updatedHelper);
      }

      if (onAddNotification) {
        onAddNotification(
          'Pitch Accepted & Hired',
          `🎉 Your application pitch for "${selectedGig.title}" was accepted instantly! You have entered WORKING mode (booked today).`,
          'gig'
        );
      }
    }

    alert('Application sent successfully and pitch accepted! You are now HIRED and in working mode.');
    handleCloseModal();
  };

  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, []);

  const filteredGigs = gigs.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-slate-50/50 h-full overflow-y-auto pb-24">
      {/* Top Banner section */}
      <div className="bg-white px-5 py-3 border-b border-slate-100 shadow-sm">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.8, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="w-10 h-10 flex-shrink-0 bg-emerald-600 rounded-xl flex items-center justify-center shadow"
            >
              <Briefcase className="text-white" size={18} />
            </motion.div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-emerald-600/85 uppercase">GIGS MARKETPLACE</span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Casual Gigs
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus size={12} />
            Post a Gig
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search active tasks or locations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Categories List */}
        <div className="flex gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar whitespace-nowrap scroll-smooth">
          {GIG_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight transition-all duration-300 ${
                selectedCategory === cat 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/15' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence>
          {isPosting && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-black text-slate-900">Post a new casual gig</h2>
                <button onClick={() => setIsPosting(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X size={16} /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Job Title</label>
                  <input type="text" placeholder="e.g., Weed Garden Yard" value={newGig.title} onChange={e => setNewGig({...newGig, title: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Budget Offered Rands</label>
                  <input type="text" placeholder="e.g., 250" value={newGig.price} onChange={e => setNewGig({...newGig, price: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Start Date</label>
                  <select 
                    value={newGig.startDate === 'Immediately' ? 'Immediately' : 'Scheduled'} 
                    onChange={e => setNewGig({...newGig, startDate: e.target.value === 'Immediately' ? 'Immediately' : ''})} 
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm"
                  >
                    <option value="Immediately">Immediately</option>
                    <option value="Scheduled">Scheduled Date</option>
                  </select>
                  {newGig.startDate !== 'Immediately' && (
                    <input type="date" value={newGig.startDate} onChange={e => setNewGig({...newGig, startDate: e.target.value})} className="mt-2 w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Termination Date</label>
                  <input type="date" value={newGig.endDate} onChange={e => setNewGig({...newGig, endDate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm" />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Job Description & Tools Required</label>
                  <textarea placeholder="Describe explicit milestones..." value={newGig.description} onChange={e => setNewGig({...newGig, description: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl h-24 text-sm" />
                </div>
                
                <div className="md:col-span-2 space-y-1">
                  <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200/45 rounded-xl text-xs font-bold text-slate-700 transition-all">
                    <Plus size={14} /> Add Task Images
                  </button>
                  {newGig.images.length > 0 && (
                    <div className="flex gap-2 p-1 overflow-x-auto">
                      {newGig.images.map((img, i) => (
                        <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-100">
                          <img src={img} alt="upload preview" className="w-full h-full object-cover" />
                          <button onClick={() => setNewGig(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 bg-red-600 text-white rounded-lg p-0.5">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleCreateGig} className="md:col-span-2 p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/10">Publish Casual Job</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gigs List Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGigs.map((gig, idx) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3 }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group relative"
              onClick={() => setSelectedGig(gig)}
            >
              {/* Status Ribbon/Badge */}
              {gig.status === 'active' && (
                <div className="absolute top-4 right-4 z-10 bg-amber-500 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  <span>{gig.workerEmail === (profile?.email || '21lucihanomatthews@gmail.com') ? 'Working' : 'Booked'}</span>
                </div>
              )}
              {gig.status === 'completed' && (
                <div className="absolute top-4 right-4 z-10 bg-blue-600 text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                  ✅ Completed
                </div>
              )}

              {gig.image && (
                <div className="relative h-44 w-full bg-slate-150 overflow-hidden">
                  <img src={gig.image} alt={gig.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <span className="absolute bottom-4 left-4 bg-emerald-600 text-white font-black px-3 py-1 rounded-xl text-xs shadow-lg shadow-emerald-600/25 uppercase tracking-widest">
                    R {gig.price}
                  </span>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">{gig.category}</span>
                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                      <Clock size={10} /> {gig.startDate}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mt-1">
                    {gig.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-semibold">
                    {gig.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> Cape Town Division
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-700">By: {gig.employer === 'You' ? 'You' : gig.employer.split(' ')[0]}</span>
                    <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5 group-hover:text-emerald-700 bg-emerald-50 border border-emerald-100/40 px-2.5 py-1 rounded-lg transition-colors">
                      View <Sparkles size={11} className="text-emerald-500" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Full Detail Gigs Dialog Overlay */}
      <FullScreenModal isOpen={!!selectedGig} onClose={handleCloseModal}>
        {selectedGig && (
          <div className="p-6 pb-20">
            {/* Top Media slider */}
            {selectedGig.images && selectedGig.images.length > 0 ? (
              <div className="flex overflow-x-auto gap-3 pb-3 snap-x">
                {selectedGig.images.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setFullScreenImage(img)} className="w-[320px] flex-shrink-0 h-44 object-cover rounded-2xl snap-center cursor-pointer shadow-sm border border-slate-100" />
                ))}
              </div>
            ) : selectedGig.image ? (
              <img src={selectedGig.image} alt="" onClick={() => setFullScreenImage(selectedGig.image!)} className="w-full h-48 object-cover rounded-2xl shadow-sm cursor-pointer mb-4 hover:opacity-95 transition-all" />
            ) : null}

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{selectedGig.category}</span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{selectedGig.title}</h2>
                
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/35 w-max">
                  <Calendar size={14} className="text-slate-400" />
                  <span>Start: {selectedGig.startDate}</span>
                  {selectedGig.endDate && (
                    <>
                      <span className="text-slate-300">|</span>
                      <span>Finish: {selectedGig.endDate}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-3 rounded-2xl flex flex-col items-center">
                <span className="text-[9px] font-black text-emerald-600 tracking-wider">OFFERED</span>
                <span className="text-2xl font-black tracking-tight tabular-nums">R {selectedGig.price}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="md:col-span-2">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-2">Job Description</h4>
                <p className="text-slate-600 text-sm leading-relaxed font-medium bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50">{selectedGig.description}</p>
                
                <div className="mt-8">
                  {selectedGig.employer === 'You' && (
                    <button 
                      onClick={() => handleDeleteGig(selectedGig.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors border border-red-150 mb-4"
                    >
                      <Trash2 size={18} />
                      Delete Casual Gig
                    </button>
                  )}

                  {selectedGig.status === 'completed' ? (
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 p-5 rounded-3xl text-sm font-bold flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm">✓</div>
                      <div>
                        <span className="font-extrabold text-sm block mb-1">🎉 Job Certified Complete</span>
                        <span className="text-xs text-slate-500 font-semibold block">This task has been fully executed, and the helper returned to standard available mode.</span>
                      </div>
                    </div>
                  ) : selectedGig.status === 'active' ? (
                    selectedGig.workerEmail === (profile?.email || '21lucihanomatthews@gmail.com') ? (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 p-5 rounded-3xl text-sm font-semibold flex flex-col gap-1.5 shadow-sm">
                          <span className="flex items-center gap-2 text-slate-900 font-black text-sm">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse inline-block" />
                            You are hired for this gig!
                          </span>
                          <span className="text-xs text-slate-600 font-medium leading-relaxed block">
                            Your helper account has been transitionally set to <strong>WORKING mode (booked today)</strong>.
                          </span>
                        </div>
                        <button 
                          onClick={handleCompleteGig}
                          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-emerald-600/10 transition-all active:scale-95 text-xs uppercase tracking-widest cursor-pointer"
                        >
                          <CheckCircle size={18} />
                          Complete Gig & Return to Available
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-100/80 border border-slate-200 text-slate-700 p-5 rounded-3xl text-xs font-bold flex flex-col items-center gap-1.5 text-center">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">💼</div>
                        <div>
                          <span className="font-black text-xs block uppercase">Hired & In Progress</span>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">Another verified member is currently completing this task.</span>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {selectedGig.employer === 'You' || (profile?.name && selectedGig.employer === profile.name) ? (
                        <div className="bg-slate-50 border border-slate-200/65 p-5 rounded-3xl text-sm font-semibold text-slate-750 flex flex-col items-center gap-2 text-center shadow-inner">
                          <span className="text-xl">🚫</span>
                          <div>
                            <span className="font-extrabold text-xs block uppercase text-slate-700 tracking-wider">Own Posted Casual Gig</span>
                            <span className="text-[11px] text-slate-400 font-medium block mt-1 leading-relaxed">
                              You cannot hire yourself or submit pitch applications to your own listed casual jobs.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Premium instant acceptance trigger */}
                          <button 
                            onClick={handleDirectHire}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-black py-4 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all duration-300 active:scale-95 text-xs uppercase tracking-widest cursor-pointer"
                          >
                            <Sparkles size={16} />
                            Quick Accept & Start Working
                          </button>

                          <div className="text-center text-slate-400 font-black text-[9px] uppercase tracking-widest py-1">— OR APPLY WITH LETTER —</div>

                          {!isApplying ? (
                            <button 
                              onClick={() => setIsApplying(true)}
                              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95 text-xs uppercase tracking-widest cursor-pointer"
                            >
                              Apply of this Task
                            </button>
                          ) : (
                            <div className="space-y-4 pt-4 border-t border-slate-150">
                              <div>
                                <label className="block text-xs font-black text-slate-400 uppercase mb-2">Detailed pitching letter</label>
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl min-h-[120px] focus:ring-2 focus:ring-emerald-500 text-sm"
                                  placeholder="Tell the employer why you are verified and fit for this task..."
                                  value={applyText}
                                  onChange={(e) => setApplyText(e.target.value)}
                                />
                              </div>
                              
                              {/* Optional Interactive Video Recording Suite */}
                              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <span className="block text-xs font-black text-slate-400 uppercase mb-3">Self Video Pitching Pitch</span>
                                 
                                {!videoUrl && !isCameraOpen && (
                                  <button 
                                    onClick={openCamera}
                                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors text-slate-700 text-xs font-black w-full justify-center shadow-sm"
                                  >
                                    <Video size={16} className="text-blue-500" />
                                    Record Live Video explanation
                                  </button>
                                )}

                                {isCameraOpen && (
                                  <div className="relative rounded-2xl overflow-hidden bg-black w-full aspect-video border-2 border-slate-800">
                                    <video 
                                      ref={videoPreviewRef} 
                                      autoPlay 
                                      muted 
                                      playsInline
                                      className="w-full h-full object-cover scale-x-[-1]"
                                    />
                                    
                                    {isRecording && (
                                      <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                        Recording
                                      </div>
                                    )}

                                    <div className="absolute bottom-4 left-0 right-0 gap-3 flex justify-center items-center">
                                      <button 
                                        onClick={closeCamera}
                                        className="w-10 h-10 bg-white/30 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
                                      >
                                        <X size={18} />
                                      </button>
                                      
                                      {!isRecording ? (
                                        <button 
                                          onClick={startRecording}
                                          className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all shadow-lg outline outline-4 outline-offset-2 outline-red-500/20"
                                        >
                                          <Video size={22} className="text-white" />
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={stopRecording}
                                          className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all animate-pulse"
                                        >
                                          <StopCircle size={24} className="text-white" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {videoUrl && (
                                  <div className="space-y-3">
                                    <video 
                                      src={videoUrl} 
                                      controls 
                                      className="w-full rounded-2xl aspect-video bg-black"
                                    />
                                    <div className="flex gap-2">
                                      <button 
                                        onClick={openCamera}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-250 bg-white rounded-xl text-xs font-bold text-slate-700"
                                      >
                                        <RefreshCw size={14} />
                                        Retake
                                      </button>
                                      <button 
                                        onClick={discardVideo}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-red-200 bg-white rounded-xl text-xs font-bold text-red-600"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <button 
                                onClick={handleSendApplication}
                                disabled={!applyText.trim() && !videoUrl}
                                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-emerald-600/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
                              >
                                <Send size={16} />
                                Submit Application Letter
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar card metadata */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl self-start space-y-4">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">Employer Information</h4>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-200 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" className="object-cover w-full h-full" alt="" />
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-900 flex items-center gap-1">
                      {selectedGig.employer}
                      <CheckCircle2 size={14} className="text-blue-500 fill-blue-50" />
                    </div>
                    <div className="text-[10px] font-black tracking-wider text-slate-400 uppercase">CAPE TOWN CLIENT</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/50 space-y-1.5 text-xs text-slate-500">
                  <div className="font-semibold flex justify-between">
                    <span>Task Location:</span>
                    <span className="text-slate-800">Cape Town</span>
                  </div>
                  <div className="font-semibold flex justify-between">
                    <span>Account Tier:</span>
                    <span className="text-slate-800">Verified Client</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </FullScreenModal>
    </div>
  );
}
