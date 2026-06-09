import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '@/src/types';
import { motion } from 'motion/react';
import { Camera, Upload, Briefcase, GraduationCap, Edit, User, FileText, CheckCircle, Plus, Trash, RefreshCw } from 'lucide-react';
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
    console.log("Save clicked. Profile state:", tempProfile);
    if (!tempProfile.facePictureUrl) {
        setErrorMessage('Please upload a face picture before saving.');
        return;
    }

    if (tempProfile.idDocumentUrls.length === 0) {
        setErrorMessage('Please upload an ID document before saving.');
        return;
    }

    setIsScanning(true);

    setTimeout(() => {
        setIsScanning(false);
        setProfile({...tempProfile});
        setIsEditing(false);
        setShowCongrats(true);
        setTimeout(() => setShowCongrats(false), 3000);
    }, 1000);
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
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Profile</h1>
        <button onClick={() => setIsEditing(!isEditing)} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            {isEditing ? 'Cancel' : <Edit size={20} />}
        </button>
      </div>
      
      {profile.isVerified && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 flex items-center gap-2">
            <CheckCircle size={20} />
            <span className="font-bold">Verified Account</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full flex-shrink-0 bg-gray-200 overflow-hidden flex items-center justify-center border-4 border-white shadow-md">
                    {tempProfile.facePictureUrl ? <img src={tempProfile.facePictureUrl} className="w-full h-full object-cover" /> : <User className="text-gray-400 w-10 h-10" />}
                </div>
                {isEditing && (
                    <label className="cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                        Upload Face Picture
                        <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e, 'face'); e.target.value = ''; }} className="hidden" />
                    </label>
                )}
            </div>
            {isEditing && (
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <strong>Why it's important:</strong> Your <strong>face</strong> picture is securely used to verify your identity against your uploaded ID document. This helps maintain trust across the platform.
                </p>
            )}
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold">Name</label>
                <input disabled={!isEditing} value={tempProfile.name || ''} onChange={(e) => setTempProfile({...tempProfile, name: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold">Surname</label>
                <input disabled={!isEditing} value={tempProfile.surname || ''} onChange={(e) => setTempProfile({...tempProfile, surname: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold">Location</label>
                <input disabled={!isEditing} value={tempProfile.location || ''} onChange={(e) => setTempProfile({...tempProfile, location: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold">Contact Information</label>
                <input disabled={!isEditing} value={tempProfile.contactInfo || ''} onChange={(e) => setTempProfile({...tempProfile, contactInfo: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold">Email</label>
                <input disabled={!isEditing} value={tempProfile.email || ''} onChange={(e) => setTempProfile({...tempProfile, email: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
                <label className="block text-sm font-bold">High School Level</label>
                <input disabled={!isEditing} value={tempProfile.schoolLevel || ''} onChange={(e) => setTempProfile({...tempProfile, schoolLevel: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
        </div>

        {/* Work Experiences */}
        <div className='space-y-2'>
            <label className="block text-sm font-bold">Work Experiences</label>
            {tempProfile.workExperiences.map((exp, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span>{exp.title} at {exp.company} ({exp.duration})</span>
                    {isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => {
                          console.log('Work edit clicked for index', idx);
                          setTempItem(exp);
                          setEditingIndex(idx);
                          setModalType('work');
                        }} className="text-blue-500"><Edit size={16} /></button>
                        <button onClick={() => setTempProfile({...tempProfile, workExperiences: tempProfile.workExperiences.filter((_, i) => i !== idx)})} className="text-red-500"><Trash size={16} /></button>
                      </div>
                    )}
                </div>
            ))}
            {isEditing && (
                <button onClick={() => {
                    setTempItem({title: '', company: '', duration: ''});
                    setEditingIndex(null);
                    setModalType('work');
                }} className="flex items-center gap-2 text-blue-600 font-bold text-sm"><Plus size={16}/> Add Work Experience</button>
            )}
        </div>

        {/* References */}
        <div className='space-y-2'>
            <label className="block text-sm font-bold">References</label>
            {tempProfile.references.map((ref, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span>{ref.name} - {ref.contact}</span>
                    {isEditing && (
                      <div className="flex gap-2">
                        <button onClick={() => {
                          setTempItem(ref);
                          setEditingIndex(idx);
                          setModalType('ref');
                        }} className="text-blue-500"><Edit size={16} /></button>
                        <button onClick={() => setTempProfile({...tempProfile, references: tempProfile.references.filter((_, i) => i !== idx)})} className="text-red-500"><Trash size={16} /></button>
                      </div>
                    )}
                </div>
            ))}
            {isEditing && (
                <button onClick={() => {
                    setTempItem({name: '', contact: ''});
                    setEditingIndex(null);
                    setModalType('ref');
                }} className="flex items-center gap-2 text-blue-600 font-bold text-sm"><Plus size={16}/> Add Reference</button>
            )}
        </div>

        {/* Documents */}
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-bold mb-2">Supporting Documents</label>
                {tempProfile.certificateUrls.map((url, idx) => <img key={idx} src={url} className='w-full rounded-lg h-20 object-cover mb-2' />)}
                {isEditing && (
                    <div className="flex flex-col gap-2">
                        <label className={`block text-center p-3 border-2 border-dashed rounded-lg cursor-pointer`}>
                            <Upload size={20} className='mx-auto'/> 
                            Upload File
                            <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e, 'cert'); e.target.value = ''; }} className="hidden" />
                        </label>
                    </div>
                )}
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">ID Documents</label>
                {tempProfile.idDocumentUrls.map((url, idx) => <img key={idx} src={url} className='w-full rounded-lg h-20 object-cover mb-2' />)}
                {isEditing && (
                    <div className="flex flex-col gap-2">
                        <label className={`block text-center p-3 border-2 border-dashed rounded-lg cursor-pointer`}>
                            <Upload size={20} className='mx-auto'/> 
                            Upload File
                            <input type="file" accept="image/*" onChange={(e) => { handleFileUpload(e, 'id'); e.target.value = ''; }} className="hidden" />
                        </label>
                    </div>
                )}
            </div>
        </div>

        {isEditing && (
            <button disabled={isScanning} onClick={() => { handleSave(); }} className="w-full p-3 bg-blue-600 text-white rounded-lg font-bold disabled:bg-gray-400 flex items-center justify-center gap-2">
                {isScanning ? <><RefreshCw className="animate-spin" size={16}/> Saving...</> : 'Save Profile'}
            </button>
        )}
      </div>

      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4 pointer-events-auto"
            >
                <div className="text-6xl">👏</div>
                <h2 className="text-2xl font-black text-gray-900">Congratulations!</h2>
                <p className="text-gray-600">Your profile has been saved successfully.</p>
            </motion.div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm mx-4"
            >
                <div className="text-6xl text-red-500">❌</div>
                <h2 className="text-2xl font-black text-gray-900">Doesn't match</h2>
                <p className="text-gray-600">{errorMessage}</p>
                <button onClick={() => setErrorMessage(null)} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold w-full">Okay</button>
            </motion.div>
        </div>
      )}

      <SimpleModal isOpen={modalType !== null} onClose={() => setModalType(null)} title={modalType === 'work' ? 'Edit Work' : 'Edit Reference'}>
          {modalType === 'work' && (
              <div className='space-y-3'>
                  <input placeholder='Title' value={tempItem.title} onChange={e => setTempItem({...tempItem, title: e.target.value})} className='w-full p-2 border rounded-lg' />
                  <input placeholder='Company' value={tempItem.company} onChange={e => setTempItem({...tempItem, company: e.target.value})} className='w-full p-2 border rounded-lg' />
                  <input placeholder='Duration' value={tempItem.duration} onChange={e => setTempItem({...tempItem, duration: e.target.value})} className='w-full p-2 border rounded-lg' />
                  <button onClick={handleSaveItem} className='w-full p-2 bg-blue-600 text-white rounded-lg font-bold'>Save</button>
              </div>
          )}
          {modalType === 'ref' && (
              <div className='space-y-3'>
                  <input placeholder='Name' value={tempItem.name} onChange={e => setTempItem({...tempItem, name: e.target.value})} className='w-full p-2 border rounded-lg' />
                  <input placeholder='Contact' value={tempItem.contact} onChange={e => setTempItem({...tempItem, contact: e.target.value})} className='w-full p-2 border rounded-lg' />
                  <button onClick={handleSaveItem} className='w-full p-2 bg-blue-600 text-white rounded-lg font-bold'>Save</button>
              </div>
          )}
      </SimpleModal>
    </div>
  )
}
