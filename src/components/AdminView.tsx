import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Eye, ShieldAlert, TrendingUp, AlertCircle, FileCheck, CheckCircle2, Megaphone, Plus, BellRing } from 'lucide-react';
import { FullScreenModal } from './FullScreenModal';
import { Payment, Gig } from '@/src/types';
import { playSoftChime } from '../lib/audio';
import { CoinAnimation } from './CoinAnimation';

export function AdminView({ 
  payments, 
  setPayments, 
  setBalance, 
  profit, 
  setProfit,
  gigs,
  setGigs,
  addNotification
}: { 
  payments: Payment[], 
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>, 
  setBalance: React.Dispatch<React.SetStateAction<number>>, 
  profit: number, 
  setProfit: React.Dispatch<React.SetStateAction<number>>,
  gigs: Gig[],
  setGigs: React.Dispatch<React.SetStateAction<Gig[]>>,
  addNotification: (title: string, message: string, type: 'gig' | 'promotion' | 'system') => void
}) {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  // Broadcaster State
  const [promoTitle, setPromoTitle] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  
  const [gigTitle, setGigTitle] = useState('');
  const [gigCategory, setGigCategory] = useState('Gardener');
  const [gigPrice, setGigPrice] = useState('');
  const [gigDesc, setGigDesc] = useState('');

  const handleBroadcastPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim() || !promoMessage.trim()) return;

    // Trigger Notification
    addNotification(promoTitle, promoMessage, 'promotion');

    // Clear state
    setPromoTitle('');
    setPromoMessage('');
    alert('Promo alert broadcasted successfully! Soft bell sound triggered.');
  };

  const handleSpawnGigAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gigTitle.trim() || !gigPrice.trim() || !gigDesc.trim()) return;

    const newGigId = `admin-spawned-${Date.now()}`;
    const newGig: Gig = {
      id: newGigId,
      title: gigTitle,
      description: gigDesc,
      price: gigPrice,
      category: gigCategory,
      status: 'available',
      employer: 'TimeGiG Representative',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=500',
      startDate: 'Immediately'
    };

    // Add to shared gigs state
    setGigs(prev => [newGig, ...prev]);

    // Dispatch warning trigger
    addNotification(
      'New Task Dispatch Alert',
      `🚨 [Hiring Alert] New high-paying ${gigCategory} job listed: "${gigTitle}" for R ${gigPrice}! Click GIGS in the menu to bid.`,
      'gig'
    );

    // Clear
    setGigTitle('');
    setGigPrice('');
    setGigDesc('');
    alert('Task successfully spawned and broadcast to TimeGiG network!');
  };

  const approvePayment = (payment: Payment) => {
    const coins = parseInt(payment.option.replace('c', ''));
    setBalance(prev => prev + coins);
    setProfit(prev => prev + parseFloat(payment.price.replace('R', '').replace(',', '.')));
    setPayments(prev => prev.filter(item => item.id !== payment.id));
    
    // Trigger animation
    setShowCoinAnimation(true);
    playSoftChime();
    setTimeout(() => setShowCoinAnimation(false), 2000);
  };

  const rejectPayment = (payment: Payment) => {
    setPayments(prev => prev.filter(item => item.id !== payment.id));
  };


  return (
    <div className="p-6 pb-24 h-full overflow-y-auto max-w-4xl mx-auto">
      <div className="mb-6">
        <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">GIGHELP OPERATOR PORTAL</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-0.5">Admin Control Room</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Live profits */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <span className="text-[9px] font-black text-slate-400 tracking-widest block uppercase">COMBINED LIVE MARGINS</span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">R {profit.toFixed(2)}</h2>
          <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-3 font-semibold">
            <TrendingUp size={14} /> Systems active & cleared
          </div>
        </div>

        {/* Verification Queue stats */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 tracking-widest block uppercase">VERIFICATIONS IN PIPELINE</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">2 Pending</h2>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 w-max mt-3">Manual SLA 15m</span>
        </div>

        {/* Flat fees metrics */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-400 tracking-widest block uppercase">DEPOSIT RECEIPTS PURE QUEUE</span>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{payments.length} Documents</h2>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 w-max mt-3">Awaiting Approval</span>
        </div>
      </div>

      {/* Main logs list */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest mb-4">Pending deposits logs</h3>
        
        {payments.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-2xl border border-slate-200/40 text-slate-400">
            <FileCheck size={32} className="mx-auto text-slate-300 mb-2" />
            <h4 className="font-bold text-sm text-slate-700">All cleared down!</h4>
            <p className="text-xs max-w-sm mx-auto mt-1">No top-up receipts submitted by Cape Town users require manual verification right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map(p => (
              <div key={p.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                <div>
                  <div className="flex items-center gap-1.5 mb-1 bg-white border border-slate-200/40 px-2.5 py-1 rounded-xl w-max">
                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest leading-none">Awaiting Review</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">User: {p.user} — Purchase: {p.option}</h4>
                  <p className="text-xs text-slate-400 font-bold tracking-tight uppercase mt-0.5">Price: {p.price} • Submitted just now</p>
                </div>
                
                <div className="flex gap-2 self-end sm:self-auto">
                  <button 
                    onClick={() => setSelectedProof(p.proofUrl || null)} 
                    className="p-2.5 bg-white border border-slate-250 hover:bg-slate-100 text-slate-600 rounded-xl transition-all font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
                    title="View Receipt File"
                  >
                    <Eye size={16} /> POP
                  </button>
                  <button 
                    onClick={() => approvePayment(p)} 
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-md shadow-emerald-500/10 active:scale-95"
                    title="Approve Coins"
                  >
                    <Check size={16} />
                  </button>
                  <button 
                    onClick={() => rejectPayment(p)} 
                    className="p-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-all active:scale-95"
                    title="Reject Proof"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Promotion Broadcast Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Megaphone size={16} />
              </div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest mt-0.5">Broadcast System Promotion</h3>
            </div>
            
            <form onSubmit={handleBroadcastPromo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Promo Title</label>
                <input 
                  type="text" 
                  value={promoTitle}
                  onChange={e => setPromoTitle(e.target.value)}
                  placeholder="e.g. June Winter Bonus Offer" 
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Alert message</label>
                <textarea 
                  value={promoMessage}
                  onChange={e => setPromoMessage(e.target.value)}
                  placeholder="e.g. Deposit 100c right now and get +25c loyalty coin credit into your verified TimeGiG card instantly!" 
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200/60 rounded-xl h-24 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-150 flex items-center justify-center gap-1.5"
              >
                <BellRing size={14} className="animate-bounce" /> Broadcast Memo & Chime
              </button>
            </form>
          </div>
        </div>

        {/* Gig spawner panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Plus size={16} />
              </div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-widest mt-0.5">Spawn Network Gig Alert</h3>
            </div>
            
            <form onSubmit={handleSpawnGigAlert} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Task Title</label>
                  <input 
                    type="text" 
                    value={gigTitle}
                    onChange={e => setGigTitle(e.target.value)}
                    placeholder="e.g. Urgent Pool Clean Helper" 
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Target Category</label>
                  <select 
                    value={gigCategory}
                    onChange={e => setGigCategory(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Gardener">Gardener</option>
                    <option value="Pet Sitter">Pet Sitter</option>
                    <option value="Math Tutor">Math Tutor</option>
                    <option value="Handyman">Handyman</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Budget Offered Rands</label>
                  <input 
                    type="text" 
                    value={gigPrice}
                    onChange={e => setGigPrice(e.target.value)}
                    placeholder="e.g. 550" 
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Alert description</label>
                <textarea 
                  value={gigDesc}
                  onChange={e => setGigDesc(e.target.value)}
                  placeholder="Explain requirements explicitly. This will be posted to the live network catalog..." 
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl h-16 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                className="w-full py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-150 flex items-center justify-center gap-1.5"
              >
                <Plus size={14} /> Spawn Gig & Broadcast
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Proof of Payment Fullscreen Modal content */}
      {showCoinAnimation && <CoinAnimation />}
      <FullScreenModal isOpen={!!selectedProof} onClose={() => setSelectedProof(null)}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">SUBMITTED POP PROOF</span>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">Capitec Proof-Of-Payment Document</h2>
            </div>
            <button onClick={() => setSelectedProof(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X size={16} /></button>
          </div>
          {selectedProof ? (
            <div className="relative rounded-2xl overflow-hidden shadow-md max-h-[60vh] bg-slate-50 flex items-center justify-center border border-slate-100">
              <img src={selectedProof} alt="Proof" className="max-w-full max-h-[60vh] object-contain" />
            </div>
          ) : (
            <div className="w-full h-80 bg-slate-150 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center p-6 text-slate-400">
              <AlertCircle size={32} className="text-slate-300 mb-2" />
              <p className="font-bold text-xs">No attachment proof uploaded</p>
            </div>
          )}
        </div>
      </FullScreenModal>
    </div>
  );
}
