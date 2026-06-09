import React, { useState, useRef, useEffect, ChangeEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Mail, Search, Plus, Star, MapPin, Briefcase, Award, CheckCircle2, Navigation, Heart, Filter, ArrowUpRight, X, Upload, Sparkles, Camera, Trash2 } from 'lucide-react';
import { Helper, UserProfile } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';
import LiveStorageService from '../lib/supabase';

interface PremiumHelper extends Helper {
  rating: string;
  location: string;
  completedTasks: number;
  rate: string;
  availableNow: boolean;
  specialty: string;
  verified: boolean;
}

const PREMIUM_HELPERS: PremiumHelper[] = [];

const CATEGORIES = ['All', 'Gardener', 'Pet Sitter', 'Math Tutor', 'Handyman'];

interface HelperViewProps {
  profile: UserProfile;
}

export function HelperView({ profile }: HelperViewProps) {
  const [selectedHelper, setSelectedHelper] = useState<PremiumHelper | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  
  // Helpers state
  const [helpers, setHelpers] = useState<PremiumHelper[]>([]);

  useEffect(() => {
    async function loadHelpers() {
      const liveHelpers = await LiveStorageService.getHelpers([]);
      setHelpers(liveHelpers);
    }
    loadHelpers();
  }, []);

  // Media URLs / Portfolio files dictionary state
  const [mediaUrls, setMediaUrls] = useState<Record<string, {url: string, type: string}[]>>(() => {
    const saved = localStorage.getItem('gighelp_helper_media_urls');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading media urls', e);
      }
    }
    return {};
  });

  // Become a Helper Modal and Form States
  const [isBecomeHelperOpen, setIsBecomeHelperOpen] = useState(false);
  const [role, setRole] = useState('Math Tutor');
  const [rate, setRate] = useState('R85/hr');
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [tempImages, setTempImages] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tempFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('gighelp_helpers', JSON.stringify(helpers));
  }, [helpers]);

  useEffect(() => {
    localStorage.setItem('gighelp_helper_media_urls', JSON.stringify(mediaUrls));
  }, [mediaUrls]);

  // Check if current user already has listed themselves as a helper
  const myHelperProfile = helpers.find(h => h.contact === profile.email);
  const isAlreadyHelper = !!myHelperProfile;

  // Open modal and automatically prepopulate or load existing helper info
  const openBecomeHelperModal = () => {
    if (myHelperProfile) {
      setRole(myHelperProfile.role);
      setRate(myHelperProfile.rate);
      setSpecialty(myHelperProfile.specialty);
      setBio(myHelperProfile.bio);
      const currentMedia = mediaUrls[myHelperProfile.id] || [];
      setTempImages(currentMedia.map(m => m.url));
    } else {
      // Automatic profile binding
      setRole('Math Tutor');
      setRate('R90/hr');
      setSpecialty(profile.schoolLevel || 'Academic Tutor');
      
      const defaultBio = `Hi, I am ${profile.name}! I have specialized skills such as: ${
        profile.workExperiences?.map(w => w.title).join(', ') || 'personal mentoring'
      }. Passionate about high-quality delivery and client satisfaction.`;
      setBio(defaultBio);
      setTempImages([]);
    }
    setIsBecomeHelperOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, helperId: string) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMedia = files.map((file: File) => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setMediaUrls(prev => ({
        ...prev,
        [helperId]: [...(prev[helperId] || []), ...newMedia]
      }));
    }
  };

  const handleTempImagesUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newUrls = files.map((file: File) => URL.createObjectURL(file));
      setTempImages(prev => [...prev, ...newUrls]);
    }
  };

  const removeTempImage = (indexToRemove: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveHelperProfile = () => {
    const helperId = myHelperProfile?.id || `user-${Date.now()}`;
    const newHelper: PremiumHelper = {
      id: helperId,
      name: `${profile.name} ${profile.surname || ''}`.trim(),
      profilePic: profile.facePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      bio: bio.trim(),
      contact: profile.email,
      role: role,
      rating: myHelperProfile?.rating || '5.0',
      location: profile.location || 'Rondebosch, Cape Town',
      completedTasks: myHelperProfile?.completedTasks || 0,
      rate: rate.trim(),
      availableNow: true,
      specialty: specialty.trim() || 'General Services',
      verified: profile.isVerified
    };

    if (isAlreadyHelper) {
      setHelpers(prev => prev.map(h => h.id === helperId ? newHelper : h));
    } else {
      setHelpers(prev => [newHelper, ...prev]);
    }

    // Sync helper registration to live database
    LiveStorageService.saveHelper(newHelper);

    // Save temporary images to our permanent media dictionary
    const mediaPayload = tempImages.map(url => ({
      url,
      type: 'image/jpeg'
    }));
    setMediaUrls(prev => ({
      ...prev,
      [helperId]: mediaPayload
    }));

    setIsBecomeHelperOpen(false);
  };

  const handleDeleteHelperProfile = () => {
    if (myHelperProfile) {
      setHelpers(prev => prev.filter(h => h.id !== myHelperProfile.id));
      setMediaUrls(prev => {
        const copy = { ...prev };
        delete copy[myHelperProfile.id];
        return copy;
      });
      // Sync delete helper from live database
      LiveStorageService.deleteHelper(myHelperProfile.id);
    }
    setIsBecomeHelperOpen(false);
  };

  const toggleFavorite = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredHelpers = helpers.filter(h => {
    const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || 
                          h.role.toLowerCase().includes(search.toLowerCase()) ||
                          h.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || h.role === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50 pb-24">
      {/* Header Panel */}
      <div className="bg-white px-5 py-3 border-b border-slate-100 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/95">
        <div className="flex justify-between items-center mb-2.5">
          <div>
            <span className="text-[10px] font-extrabold tracking-wider text-blue-600/85 uppercase">GIGHELP TEAM</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Available Helpers
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={openBecomeHelperModal}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-sm cursor-pointer ${
                isAlreadyHelper 
                  ? 'bg-amber-500 text-white hover:bg-amber-600' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isAlreadyHelper ? (
                <>
                  <Sparkles size={11} strokeWidth={2.5} />
                  Manage Profile
                </>
              ) : (
                <>
                  <Plus size={11} strokeWidth={2.5} />
                  Become Helper
                </>
              )}
            </button>
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-ping flex-shrink-0" title="System Live" />
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by specialty, skill or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200/80 py-3 pl-12 pr-4 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Horizontal Category Pill Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar whitespace-nowrap scroll-smooth">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl text-xs font-black tracking-tight transition-all duration-300 ${
                selectedCategory === category 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHelpers.map((helper, idx) => (
            <motion.div 
              key={helper.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col group relative"
              onClick={() => setSelectedHelper(helper)}
            >
              {/* Image Section */}
              <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                <img 
                  src={helper.profilePic} 
                  alt={helper.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Favorite Heart Button */}
                <button 
                  onClick={(e) => toggleFavorite(helper.id, e)} 
                  className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-md hover:bg-white text-slate-400 hover:text-red-500 transition-colors z-10"
                >
                  <Heart size={16} fill={favorites[helper.id] ? "#ef4444" : "transparent"} className={favorites[helper.id] ? "text-red-500 scale-110" : "transition-transform"} />
                </button>

                {/* Status Indicator */}
                {helper.availableNow ? (
                  <span className="absolute bottom-4 left-4 flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg shadow-lg shadow-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Active Now
                  </span>
                ) : (
                  <span className="absolute bottom-4 left-4 flex items-center gap-1 text-[10px] font-bold bg-slate-700/80 text-white px-2.5 py-1 rounded-lg backdrop-blur-sm">
                    Booked today
                  </span>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{helper.role}</span>
                    <div className="flex items-center gap-1 text-slate-700 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-black">
                      <Star size={10} className="fill-amber-500 text-amber-500" />
                      {helper.rating}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {helper.name}
                    </h3>
                    {helper.verified && (
                      <CheckCircle2 size={15} className="text-blue-500 fill-blue-50/50 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">
                    {helper.bio}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-slate-700 text-xs">
                  <div className="flex items-center gap-1 text-slate-400 font-medium flex-shrink-0">
                    <MapPin size={13} />
                    <span className="truncate max-w-[90px]">{helper.location.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {helper.rate}
                    </span>
                    <span className="text-xs font-black text-blue-600 flex items-center gap-0.5 group-hover:text-blue-700 bg-blue-50/70 border border-blue-100/40 px-2.5 py-1 rounded-lg transition-colors">
                      Hire <ArrowUpRight size={12} className="text-blue-500" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Full detail premium Freelancer Modal */}
      <FullScreenModal isOpen={!!selectedHelper} onClose={() => setSelectedHelper(null)}>
        {selectedHelper && (
          <div className="p-6">
            {/* Top header portfolio section */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-slate-100">
              <div className="relative flex-shrink-0">
                <img 
                  src={selectedHelper.profilePic} 
                  alt={selectedHelper.name} 
                  className="w-28 h-28 rounded-3xl object-cover shadow-md border-4 border-white" 
                />
                {selectedHelper.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 p-1 rounded-full text-white border border-white">
                    <CheckCircle2 size={14} className="fill-blue-500 text-white" />
                  </div>
                )}
              </div>

              <div className="text-center md:text-left flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
                  <div>
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">{selectedHelper.role}</span>
                    <h2 className="text-2xl font-black text-slate-900 mt-0.5">{selectedHelper.name}</h2>
                  </div>
                  <div className="flex items-center justify-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 w-max mx-auto md:mx-0">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">RATING</div>
                      <div className="flex items-center gap-1 font-bold text-slate-800 text-xs">
                        <Star size={12} className="fill-amber-500 text-amber-500" />
                        {selectedHelper.rating}
                      </div>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div>
                      <div className="text-[10px] font-bold text-slate-400">JOBS</div>
                      <div className="font-bold text-slate-800 text-xs text-center">{selectedHelper.completedTasks}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium bg-slate-150 px-3 py-1.5 rounded-xl">
                    <MapPin size={12} /> {selectedHelper.location}
                  </span>
                  <span className="flex items-center gap-1 font-black text-slate-900 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-100">
                    {selectedHelper.rate}
                  </span>
                </div>
              </div>
            </div>

            {/* Core description & contact block */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-2">My Biography</h4>
                  <p className="text-slate-600 leading-relaxed text-sm font-medium">"{selectedHelper.bio}"</p>
                </div>

                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider text-slate-400 mb-2">Core Specialty</h4>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 text-xs font-black rounded-xl border border-blue-100">
                    <Award size={14} /> {selectedHelper.specialty}
                  </span>
                </div>

                {/* Portfolio Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm uppercase tracking-wider text-slate-400">Visual Portfolio</h4>
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*" 
                      ref={fileInputRef} 
                      onChange={(e) => handleFileChange(e, selectedHelper.id)} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      <Plus size={14} /> Upload Work
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {/* Default Portfolio items based on specialty */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-150 border border-slate-200">
                      <img 
                        src={selectedHelper.id === '1' ? 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' :
                             selectedHelper.id === '2' ? 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300' :
                             selectedHelper.id === '3' ? 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300' :
                             'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300'} 
                        alt="Portfolio default 1" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    {/* User Uploaded Portfolio Files */}
                    {mediaUrls[selectedHelper.id]?.map((media, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-900 border border-slate-100 group shadow-sm">
                        {media.type.startsWith('image/') ? (
                          <img src={media.url} className="w-full h-full object-cover" />
                        ) : (
                          <video src={media.url} className="w-full h-full object-cover" controls />
                        )}
                        <button 
                          onClick={() => setMediaUrls(prev => ({
                            ...prev,
                            [selectedHelper.id]: prev[selectedHelper.id].filter((_, idx) => idx !== i)
                          }))}
                          className="absolute top-1.5 right-1.5 bg-slate-900/60 text-white rounded-lg p-1 hover:bg-red-600"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar stats/contact panel inside modal */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-3xl self-start space-y-4">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-400 mb-2">Contact Details</h4>
                <div className="space-y-3 font-medium text-xs text-slate-700">
                  <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/40">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Phone size={14} /></div>
                    <span className="truncate">+27 (0) 72 133 4067</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2 bg-white rounded-xl border border-slate-200/40">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Mail size={14} /></div>
                    <span className="truncate">{selectedHelper.contact}</span>
                  </div>
                </div>

                <div className="pt-2">
                  {selectedHelper.contact === (profile?.email || '21lucihanomatthews@gmail.com') ? (
                    <div className="w-full py-3 bg-slate-150 text-slate-500 font-extrabold rounded-2xl text-center text-[10px] uppercase tracking-wider border border-slate-200">
                      🚫 Your Own Helper Profile
                    </div>
                  ) : (
                    <button
                      onClick={() => alert(`Interview Request sent directly to ${selectedHelper.name}! Please monitor Chats view.`)}
                      className="w-full py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Send Hire Request <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </FullScreenModal>

      {/* Become or Edit Helper Account Modal */}
      <FullScreenModal isOpen={isBecomeHelperOpen} onClose={() => setIsBecomeHelperOpen(false)}>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={11} className="fill-blue-600" /> Professional Workspace setup
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1">
                {isAlreadyHelper ? 'Manage Helper Profile' : 'Become a Helper'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Auto-binding is active. Your basic information is pulled from TimeGiG. Just add attraction details!
              </p>
            </div>
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {isAlreadyHelper && (
                <button
                  onClick={handleDeleteHelperProfile}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 text-xs font-black rounded-2xl border border-red-100 transition-all"
                  title="Remove helper profile from listing"
                >
                  <Trash2 size={13} />
                  Remove Listing
                </button>
              )}
              <button 
                onClick={handleSaveHelperProfile}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl shadow-md shadow-blue-500/10 transition-all"
              >
                <CheckCircle2 size={13} />
                {isAlreadyHelper ? 'Save Changes' : 'Publish Helper Profile'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            {/* Form Fields & Image Upload (Left 2 columns) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Auto Info Summary block */}
              <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Linked Identity</label>
                  <div className="flex items-center gap-2 mt-1">
                    <img 
                      src={profile.facePictureUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{profile.name} {profile.surname || ''}</div>
                      <div className="text-[10px] text-slate-400">Authenticated Member</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Contact & Region (Auto)</label>
                  <div className="text-xs font-semibold text-slate-800 mt-1 truncate">{profile.email}</div>
                  <div className="text-[10px] font-medium text-slate-500">{profile.location || 'Rondebosch, Cape Town'}</div>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">Main Service Category</label>
                  <select 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">Service Rate</label>
                  <input 
                    type="text" 
                    value={rate} 
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="e.g. R95/hr" 
                    className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">Key Specialty / Slogan</label>
                <input 
                  type="text" 
                  value={specialty} 
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Specialized Algebra Tutoring or Dog Behavior Sitter" 
                  className="w-full bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1.5">My Biography</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  rows={3} 
                  className="w-full bg-slate-50 border border-slate-200/80 p-4 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm leading-relaxed"
                  placeholder="Tell clients about yourself, your tools, and your patience..."
                />
              </div>

              {/* Attraction Multiple Images Uploader */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block">Attraction & Portfolio Media</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Businesses value helpers with strong visual references. Upload multiple images of yourself, tools, and work assets.</p>
                </div>

                <div 
                  onClick={() => tempFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-3xl p-6 text-center cursor-pointer bg-slate-50 hover:bg-blue-50/20 transition-all duration-200 group"
                >
                  <Upload className="mx-auto text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" size={28} />
                  <p className="text-xs font-black text-slate-800">Choose Attraction Images</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Click to browse JPEGs/PNGs of your tutoring setups, gardening tools, or happy pets</p>
                </div>
                
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  ref={tempFileInputRef} 
                  onChange={handleTempImagesUpload} 
                  className="hidden" 
                />

                {tempImages.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2">Upload Files Preview ({tempImages.length})</h5>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {tempImages.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group bg-slate-100">
                          <img src={src} className="w-full h-full object-cover" alt="Attraction preview" />
                          <button 
                            type="button"
                            onClick={() => removeTempImage(i)}
                            className="absolute top-1.5 right-1.5 bg-slate-900/85 text-white rounded-lg p-1 hover:bg-red-600 transition-colors shadow"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Profile Preview Column */}
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider block">Live Workspace Preview</h4>
                <p className="text-[10px] text-slate-400 font-medium">This is exactly how other users or organizations will view your card in search listings.</p>
              </div>

              {/* Real-time Rendered Card */}
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md flex flex-col relative w-full max-w-sm mx-auto">
                <div className="relative h-44 w-full bg-slate-150 overflow-hidden">
                  <img 
                    src={profile.facePictureUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-4 left-4 flex items-center gap-1 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Active Now
                  </span>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">{role}</span>
                      <div className="flex items-center gap-1 text-slate-700 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px] font-black">
                        <Star size={10} className="fill-amber-500 text-amber-500" />
                        5.0
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 truncate">
                        {profile.name} {profile.surname || ''}
                      </h3>
                      {profile.isVerified && (
                        <CheckCircle2 size={14} className="text-blue-500 fill-blue-50/50 flex-shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed font-medium">
                      {bio || 'Your biography will appear here once filled.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-slate-700 text-xs">
                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                      <MapPin size={13} />
                      <span className="truncate max-w-[120px]">{profile.location?.split(',')[0] || 'Cape Town'}</span>
                    </div>
                    <div className="font-black text-slate-900 text-sm bg-slate-100 px-3 py-1 rounded-xl">
                      {rate || 'R0/hr'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Checklist visual tips */}
              <div className="p-4 bg-blue-50 border border-blue-100/60 rounded-2xl text-[11px] text-blue-800 space-y-1.5">
                <div className="font-black uppercase tracking-wider">Tips for 5★ conversion:</div>
                <div className="flex gap-1.5 items-start">
                  <span className="text-blue-500">✔</span>
                  <span><strong>Actionable Pictures:</strong> Showing yourself during active tasks or alongside materials increases hires by 4.2x.</span>
                </div>
                <div className="flex gap-1.5 items-start">
                  <span className="text-blue-500">✔</span>
                  <span><strong>Clear Pricing:</strong> Maintain transparent hourly quotes matches buyer requests easily.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FullScreenModal>
    </div>
  );
}
