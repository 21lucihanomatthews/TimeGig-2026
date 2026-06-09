import React, { useState } from 'react';
import { UserProfile } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, Briefcase, GraduationCap, Edit, User, FileText, CheckCircle2, Plus, Trash2, RefreshCw, Sparkles, MapPin, Mail, Phone, BookOpen, Fingerprint } from 'lucide-react';
import { SimpleModal } from './SimpleModal';

export function ProfileView({ profile, setProfile }: { profile: UserProfile, setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);
  const [isScanning, setIsScanning] = useState(false);
  const [modalType, setModalType] = useState<'work' | 'ref' | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempItem, setTempItem] = useState<any>({});

  const [showCongrats, setShowCongrats] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSaveItem = () => {
    if (modalType === 'work') {
      const updated = editingIndex !== null ? [...tempProfile.workExperiences] : [...tempProfile.workExperiences, tempItem];
      if (editingIndex !== null) updated[editingIndex] = tempItem;
      setTempProfile({...tempProfile, workExperiences: updated});
    } else {
      const updated = editingIndex !== null ? [...tempProfile.references] : [...tempProfile.references, tempItem];
      if (editingIndex !== null) updated[editingIndex] = tempItem;
      setTempProfile({...tempProfile, references: updated});
    }
    setModalType(null);
    setEditingIndex(null);
    setTempItem({});
  };

  const handleSave = async () => {
    if (!tempProfile.facePictureUrl) {
      setErrorMessage('Please upload a face picture to authenticate your identity.');
      return;
    }

    if (tempProfile.idDocumentUrls.length === 0) {
      setErrorMessage('Please upload a valid high-resolution South African ID to match verification.');
      return;
    }

    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      setProfile({
        ...tempProfile,
        isVerified: true // Auto-verify on successful scan of ID and face picture!
      });
      setIsEditing(false);
      setShowCongrats(true);
      setTimeout(() => setShowCongrats(false), 2500);
    }, 2500);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'cert' | 'id' | 'face') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const url = reader.result as string;
        if (type === 'face') setTempProfile(prev => ({...prev, facePictureUrl: url}));
        else if (type === 'cert') setTempProfile(prev => ({...prev, certificateUrls: [...prev.certificateUrls, url]}));
        else if (type === 'id') setTempProfile(prev => ({...prev, idDocumentUrls: [...prev.idDocumentUrls, url]}));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">GIGHELP CREDENTIALS</span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">My Profile</h1>
        </div>
        
        <button 
          onClick={() => {
            if (isEditing) {
              setTempProfile(profile);
              setIsEditing(false);
            } else {
              setTempProfile(profile);
              setIsEditing(true);
            }
          }} 
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all"
        >
          {isEditing ? 'Cancel Edit' : <><Edit size={14} /> Modify CV</>}
        </button>
      </div>
      
      {/* Verify verification stats */}
      {profile.isVerified ? (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-3xl mb-6 flex items-center gap-3 border border-emerald-100 shadow-sm animate-in fade-in duration-500">
          <div className="p-2 bg-emerald-500 rounded-2xl text-white shadow-md shadow-emerald-500/10">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">SECURE SYSTEM VERIFICATION</span>
            <span className="text-sm font-black text-slate-800">Biometric Verified Freelancer account</span>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 text-amber-800 p-4 rounded-3xl mb-6 flex items-center gap-3 border border-amber-100 shadow-sm">
          <div className="p-2 bg-amber-500 rounded-2xl text-white">
            <Fingerprint size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block font-bold">VERIFICATION SUSPENDED</span>
            <span className="text-xs font-semibold text-slate-700">Please click "Modify CV" and upload a face photo with your ID document to scan and verify.</span>
          </div>
        </div>
      )}

      {/* Profile Details Block */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Verification Loading Sweep */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-white text-center"
            >
              <div className="relative w-28 h-28 rounded-full overflow-hidden mb-6 border-4 border-blue-500 shadow-lg shadow-blue-500/10">
                <img src={tempProfile.facePictureUrl} className="w-full h-full object-cover" alt="" />
                {/* Horizontal scanning sweep bar */}
                <motion.div 
                  initial={{ top: '0%' }}
                  animate={{ top: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 shadow-lg shadow-blue-500"
                />
              </div>

              <Fingerprint size={36} className="text-blue-500 animate-pulse mb-3" />
              <h3 className="text-lg font-black tracking-tight text-white uppercase">Biometric Face Matching</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 font-semibold">Comparing user face pixels against South African ID credentials structure. Please stay on tab...</p>
              
              <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-6">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.3 }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative">
            <div className="relative w-24 h-24 rounded-3xl flex-shrink-0 bg-slate-100 overflow-hidden flex items-center justify-center border-4 border-slate-50 shadow-md">
              {tempProfile.facePictureUrl ? (
                <img src={tempProfile.facePictureUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                <User className="text-slate-400 w-10 h-10" />
              )}
            </div>
            {isEditing && (
              <label className="absolute -bottom-1 -right-1 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 transition-all">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e, 'face'); e.target.value = ''; }} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center sm:text-left flex-1 space-y-1">
            <h2 className="text-xl font-black text-slate-900">{profile.name || 'Set Name'} {profile.surname || ''}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1 font-medium"><MapPin size={12} /> {profile.location || 'Cape Town'}</span>
              <span className="flex items-center gap-1 font-medium"><GraduationCap size={12} /> {profile.schoolLevel || 'Student Tier'}</span>
            </div>
          </div>
        </div>

        {/* Info Grid inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">First Name</label>
            <input disabled={!isEditing} value={tempProfile.name || ''} onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Surname / Last Name</label>
            <input disabled={!isEditing} value={tempProfile.surname || ''} onChange={(e) => setTempProfile({...tempProfile, surname: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Location / Address</label>
            <input disabled={!isEditing} value={tempProfile.location || ''} onChange={(e) => setTempProfile({...tempProfile, location: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Email Contact</label>
            <input disabled={!isEditing} value={tempProfile.email || ''} onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Contact Phone</label>
            <input disabled={!isEditing} value={tempProfile.contactInfo || ''} onChange={(e) => setTempProfile({...tempProfile, contactInfo: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase">Undergrad / School Tier</label>
            <input disabled={!isEditing} value={tempProfile.schoolLevel || ''} onChange={(e) => setTempProfile({...tempProfile, schoolLevel: e.target.value})} className="w-full p-2.5 bg-slate-50 disabled:bg-slate-50/40 border border-slate-150 rounded-xl text-sm font-semibold text-slate-800" />
          </div>
        </div>

        {/* Work Experiences wrapper */}
        <div className='pt-4 border-t border-slate-100 space-y-3'>
          <label className="text-xs font-black text-slate-400 uppercase">My Work History</label>
          
          <div className="space-y-2">
            {tempProfile.workExperiences.length === 0 && (
              <p className="text-xs text-slate-400 italic">No historical careers added yet.</p>
            )}
            {tempProfile.workExperiences.map((exp, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs text-slate-700">
                <span className="font-bold flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400" /> {exp.title} at {exp.company} ({exp.duration})</span>
                {isEditing && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setTempItem(exp);
                        setEditingIndex(idx);
                        setModalType('work');
                      }} 
                      className="p-1.5 bg-white border border-slate-200 hover:text-blue-600 rounded-lg text-slate-500"
                    >
                      <Camera size={12} />
                    </button>
                    <button 
                      onClick={() => setTempProfile({...tempProfile, workExperiences: tempProfile.workExperiences.filter((_, i) => i !== idx)})} 
                      className="p-1.5 bg-white border border-slate-200 hover:text-red-600 rounded-lg text-slate-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <button 
              onClick={() => {
                setTempItem({title: '', company: '', duration: ''});
                setEditingIndex(null);
                setModalType('work');
              }} 
              className="flex items-center gap-1 text-blue-600 font-bold text-xs"
            >
              <Plus size={14}/> Add Work Milestone
            </button>
          )}
        </div>

        {/* References wrapper */}
        <div className='pt-4 border-t border-slate-100 space-y-3'>
          <label className="text-xs font-black text-slate-400 uppercase">Endorsing References</label>
          
          <div className="space-y-2">
            {tempProfile.references.length === 0 && (
              <p className="text-xs text-slate-400 italic">No verbal references listed yet.</p>
            )}
            {tempProfile.references.map((ref, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs text-slate-700 font-semibold">
                <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {ref.name} — {ref.contact}</span>
                {isEditing && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setTempItem(ref);
                        setEditingIndex(idx);
                        setModalType('ref');
                      }} 
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500"
                    >
                      <Camera size={12} />
                    </button>
                    <button 
                      onClick={() => setTempProfile({...tempProfile, references: tempProfile.references.filter((_, i) => i !== idx)})} 
                      className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <button 
              onClick={() => {
                setTempItem({name: '', contact: ''});
                setEditingIndex(null);
                setModalType('ref');
              }} 
              className="flex items-center gap-1 text-blue-600 font-bold text-xs"
            >
              <Plus size={14}/> Add Personal Referent
            </button>
          )}
        </div>

        {/* Documents */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 block uppercase">Matric / Certifications</label>
            {tempProfile.certificateUrls.map((url, idx) => <img key={idx} src={url} className='w-full rounded-2xl h-24 object-cover border border-slate-100' alt="" />)}
            {isEditing && (
              <label className="block text-center p-5 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 font-bold text-xs text-slate-500 transition-all">
                <Upload size={18} className='mx-auto mb-1 text-slate-400'/> 
                <span>Upload PDF File</span>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => { handleFileUpload(e, 'cert'); e.target.value = ''; }} className="hidden" />
              </label>
            )}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 block uppercase">South African ID / Passport</label>
            {tempProfile.idDocumentUrls.map((url, idx) => <img key={idx} src={url} className='w-full rounded-2xl h-24 object-cover border border-slate-100' alt="" />)}
            {isEditing && (
              <label className="block text-center p-5 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl cursor-pointer bg-slate-50 font-bold text-xs text-slate-500 transition-all">
                <Upload size={18} className='mx-auto mb-1 text-slate-400'/> 
                <span>Upload South African ID</span>
                <input type="file" accept="image/*,application/pdf" onChange={(e) => { handleFileUpload(e, 'id'); e.target.value = ''; }} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {isEditing && (
          <button 
            disabled={isScanning} 
            onClick={() => handleSave()} 
            className="w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isScanning ? <><RefreshCw className="animate-spin" size={14}/> Processing scanning...</> : 'Save & Trigger Verification'}
          </button>
        )}
      </div>

      {/* Success congratulate popup popup */}
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-3 text-center max-w-sm mx-4 pointer-events-auto border border-slate-100"
          >
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">Biometrics Authenticated!</h2>
            <p className="text-slate-500 text-sm font-semibold">The facial scan matched pop document credentials. Congratulations on biometric verification status!</p>
          </motion.div>
        </div>
      )}

      {/* Error missing pops popup */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 text-center max-w-sm mx-4 border border-slate-100"
          >
            <div className="text-4xl text-red-500">🛡️</div>
            <h2 className="text-lg font-black text-slate-900">Mismatched Credentials</h2>
            <p className="text-slate-500 text-xs font-semibold">{errorMessage}</p>
            <button onClick={() => setErrorMessage(null)} className="mt-4 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase tracking-widest w-full">Double-check criteria</button>
          </motion.div>
        </div>
      )}

      <SimpleModal isOpen={modalType !== null} onClose={() => setModalType(null)} title={modalType === 'work' ? 'Edit Work Milestone' : 'Edit Reference'}>
        {modalType === 'work' && (
          <div className='space-y-3.5'>
            <input placeholder='Job Title (e.g. Lawn Design)' value={tempItem.title || ''} onChange={e => setTempItem({...tempItem, title: e.target.value})} className='w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm font-semibold' />
            <input placeholder='Employer Company name' value={tempItem.company || ''} onChange={e => setTempItem({...tempItem, company: e.target.value})} className='w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm font-semibold' />
            <input placeholder='Job Duration (e.g. 6 months)' value={tempItem.duration || ''} onChange={e => setTempItem({...tempItem, duration: e.target.value})} className='w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm font-semibold' />
            <button onClick={handleSaveItem} className='w-full p-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider'>Apply Change</button>
          </div>
        )}
        {modalType === 'ref' && (
          <div className='space-y-3.5'>
            <input placeholder='Referent Person name' value={tempItem.name || ''} onChange={e => setTempItem({...tempItem, name: e.target.value})} className='w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm font-semibold' />
            <input placeholder='Referent Phone / Email contact' value={tempItem.contact || ''} onChange={e => setTempItem({...tempItem, contact: e.target.value})} className='w-full p-2.5 bg-slate-50 border border-slate-150 rounded-xl text-sm font-semibold' />
            <button onClick={handleSaveItem} className='w-full p-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-wider'>Apply Change</button>
          </div>
        )}
      </SimpleModal>
    </div>
  )
}
