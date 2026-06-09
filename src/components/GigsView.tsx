import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Clock, DollarSign, Search, Filter, Tag, Plus, X, Video, Send, Trash2, StopCircle, RefreshCw } from 'lucide-react';
import { Gig } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';

const INITIAL_GIGS: Gig[] = [
  { id: '1', title: 'Casual Garden Help', description: 'Help with weeding and watering for 2 hours.', price: '50', category: 'Casual', status: 'available', employer: 'Local Resident', image: '/src/assets/images/gigs_realistic_3d_1780920206646.png' },
  { id: '2', title: 'Weekend Pet Sitting', description: 'Watch over a friendly dog for the weekend.', price: '100', category: 'Casual', status: 'available', employer: 'Neighbor', image: '/src/assets/images/content_3d_icon_1780919241609.png' },
];

export function GigsView() {
  const [gigs, setGigs] = useState<Gig[]>(INITIAL_GIGS);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageUrls = files.map(file => URL.createObjectURL(file));
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
      category: 'Casual',
      status: 'available',
      employer: 'You',
      images: newGig.images,
      image: newGig.images.length > 0 ? newGig.images[0] : undefined,
      startDate: newGig.startDate,
      endDate: newGig.endDate
    };
    setGigs([gig, ...gigs]);
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

  const handleSendApplication = () => {
    if (!applyText.trim() && !videoUrl) return;
    // application sent simulation
    alert('Application sent successfully!');
    handleCloseModal();
  };

  useEffect(() => {
    return () => {
      closeCamera();
    };
  }, []);

  return (
    <div className="bg-gray-50/50 h-full overflow-y-auto">
      <div className="p-8">
        {/* ... existing header and posting logic ... */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0.8, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200"
            >
              <Briefcase className="text-white" size={32} />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                Casual GiGs
              </h1>
              <p className="text-gray-500 mt-1 font-medium">Easy tasks, quick earnings.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-200"
          >
            <Plus size={20} />
            Post a Gig
          </button>
        </div>

        <AnimatePresence>
          {isPosting && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Post a new casual gig</h2>
                <button onClick={() => setIsPosting(false)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Job Title" value={newGig.title} onChange={e => setNewGig({...newGig, title: e.target.value})} className="p-3 border border-gray-200 rounded-xl" />
                <input type="text" placeholder="Price offered" value={newGig.price} onChange={e => setNewGig({...newGig, price: e.target.value})} className="p-3 border border-gray-200 rounded-xl" />
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <select 
                    value={newGig.startDate === 'Immediately' ? 'Immediately' : 'Scheduled'} 
                    onChange={e => setNewGig({...newGig, startDate: e.target.value === 'Immediately' ? 'Immediately' : ''})} 
                    className="p-3 border border-gray-200 rounded-xl w-full mb-2"
                  >
                    <option value="Immediately">Immediately</option>
                    <option value="Scheduled">Scheduled Date</option>
                  </select>
                  {newGig.startDate !== 'Immediately' && (
                    <input type="date" value={newGig.startDate} onChange={e => setNewGig({...newGig, startDate: e.target.value})} className="p-3 border border-gray-200 rounded-xl w-full" />
                  )}
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End / Termination Date</label>
                  <input type="date" value={newGig.endDate} onChange={e => setNewGig({...newGig, endDate: e.target.value})} className="p-3 border border-gray-200 rounded-xl w-full" />
                </div>

                <textarea placeholder="Description" value={newGig.description} onChange={e => setNewGig({...newGig, description: e.target.value})} className="md:col-span-2 p-3 border border-gray-200 rounded-xl h-24" />
                
                <div className="md:col-span-2">
                  <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Plus size={16} /> Add Images
                  </button>
                  {newGig.images.length > 0 && (
                    <div className="flex gap-2 p-2 mt-2 overflow-x-auto">
                      {newGig.images.map((img, i) => (
                        <div key={i} className="relative flex-shrink-0 w-20 h-20">
                          <img src={img} alt="upload preview" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => setNewGig(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleCreateGig} className="md:col-span-2 p-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black">Post</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-4 p-4">
          {gigs.map((gig, idx) => (
            <motion.div
              key={gig.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col gap-2"
              onClick={() => setSelectedGig(gig)}
            >
              {gig.image && (
                  <img src={gig.image} alt={gig.title} className="w-full h-32 object-cover rounded-xl" />
              )}
              <div>
                     <h3 className="font-bold text-gray-900 truncate text-sm">{gig.title}</h3>
                     <p className="text-xs text-gray-500 truncate">{gig.price} R</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <FullScreenModal isOpen={!!selectedGig} onClose={handleCloseModal}>
        {selectedGig && (
            <div className="p-4 pb-24">
                {selectedGig.images && selectedGig.images.length > 0 ? (
                  <div className="flex overflow-x-auto gap-4 mb-4 snap-x">
                    {selectedGig.images.map((img, i) => (
                      <img key={i} src={img} alt={`gig image ${i}`} onClick={() => setFullScreenImage(img)} className="w-4/5 flex-shrink-0 h-48 object-cover rounded-2xl snap-center cursor-pointer" />
                    ))}
                  </div>
                ) : selectedGig.image ? (
                  <img src={selectedGig.image} alt={selectedGig.title} onClick={() => setFullScreenImage(selectedGig.image!)} className="w-full h-48 object-cover rounded-2xl mb-4 cursor-pointer" />
                ) : null}
                <h2 className="text-2xl font-bold text-gray-900">{selectedGig.title}</h2>
                <div className="flex items-center gap-2 mt-2 mb-4 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg w-max">
                  <DollarSign size={18} />
                  {selectedGig.price} R
                </div>
                
                {(selectedGig.startDate || selectedGig.endDate) && (
                  <div className="flex flex-col gap-1 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {selectedGig.startDate && <div><span className="font-semibold text-gray-900">Start Date:</span> {selectedGig.startDate}</div>}
                    {selectedGig.endDate && <div><span className="font-semibold text-gray-900">End Date:</span> {selectedGig.endDate}</div>}
                  </div>
                )}
                
                <p className="text-gray-600 leading-relaxed mb-6">{selectedGig.description}</p>

                <div className="border-t border-gray-100 pt-6">
                  {selectedGig.employer === 'You' && (
                    <button 
                      onClick={() => handleDeleteGig(selectedGig.id)}
                      className="w-full mb-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-xl shadow-sm border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={20} />
                      Delete Gig
                    </button>
                  )}

                  {!isApplying ? (
                    <button 
                      onClick={() => setIsApplying(true)}
                      className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-colors active:scale-95"
                    >
                      Apply Now
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Why are you fit for the gig?</label>
                         <textarea 
                           className="w-full border border-gray-200 p-3 rounded-xl min-h-[100px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                           placeholder="Type your cover letter here..."
                           value={applyText}
                           onChange={(e) => setApplyText(e.target.value)}
                         />
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                         <span className="block text-sm font-bold text-gray-700 mb-3">Optional: Video Application</span>
                         
                         {!videoUrl && !isCameraOpen && (
                           <button 
                             onClick={openCamera}
                             className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium w-full justify-center"
                           >
                             <Video size={20} className="text-blue-500" />
                             Record Video Explanation
                           </button>
                         )}

                         {isCameraOpen && (
                           <div className="relative rounded-xl overflow-hidden bg-black w-full aspect-video">
                             <video 
                               ref={videoPreviewRef} 
                               autoPlay 
                               muted 
                               playsInline
                               className="w-full h-full object-cover scale-x-[-1]"
                             />
                             
                             {isRecording && (
                               <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-bold animate-pulse">
                                 <div className="w-2 h-2 bg-white rounded-full" />
                                 Recording
                               </div>
                             )}

                             <div className="absolute bottom-4 left-0 right-0 gap-4 flex justify-center items-center">
                                <button 
                                  onClick={closeCamera}
                                  className="w-12 h-12 bg-white text-gray-800 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
                                >
                                  <X size={24} />
                                </button>
                                
                                {!isRecording ? (
                                  <button 
                                    onClick={startRecording}
                                    className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/50 outline outline-4 outline-offset-2 outline-red-500/30"
                                  >
                                    <Video size={28} />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={stopRecording}
                                    className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg shadow-red-500/50"
                                  >
                                    <StopCircle size={32} />
                                  </button>
                                )}
                             </div>
                           </div>
                         )}

                         {videoUrl && (
                           <div className="space-y-3 animate-in zoom-in-95">
                              <video 
                                src={videoUrl} 
                                controls 
                                className="w-full rounded-xl aspect-video bg-black"
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={openCamera}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 text-gray-700 font-medium text-sm transition-colors"
                                >
                                  <RefreshCw size={16} />
                                  Retake
                                </button>
                                <button 
                                  onClick={discardVideo}
                                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-200 bg-white rounded-lg hover:bg-red-50 text-red-600 font-medium text-sm transition-colors"
                                >
                                  <Trash2 size={16} />
                                  Discard
                                </button>
                              </div>
                           </div>
                         )}
                      </div>

                      <button 
                        onClick={handleSendApplication}
                        disabled={!applyText.trim() && !videoUrl}
                        className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                      >
                        <Send size={20} />
                        Send Application
                      </button>
                    </div>
                  )}
                </div>
            </div>
        )}
      </FullScreenModal>

      <AnimatePresence>
        {fullScreenImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black bg-opacity-95 flex items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <button 
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
              onClick={() => setFullScreenImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={fullScreenImage} 
              alt="Gig full screen" 
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
