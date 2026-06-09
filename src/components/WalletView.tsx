import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Activity, RefreshCw, CheckCircle, User, CreditCard, Copy, Check, Upload, ArrowRight, DollarSign, Eye, Plus, Volume2, VolumeX } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { WalletTransaction, WalletBalance, Payment } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';
import { isSoundEnabled, setSoundEnabled, playSoftClick } from '../lib/audio';


const CHART_HISTORY = [
  { day: 'Mon', balance: 650 },
  { day: 'Tue', balance: 1350 },
  { day: 'Wed', balance: 1100 },
  { day: 'Thu', balance: 1950 },
  { day: 'Fri', balance: 1800 },
  { day: 'Sat', balance: 2700 },
  { day: 'Sun', balance: 2500 },
];

const TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'in', amount: '250.00', currency: 'ZAR', description: 'Garden Help Payout', timestamp: Date.now() - 3600000 },
  { id: '2', type: 'out', amount: '15.00', currency: 'COIN', description: 'Platform Posting Fee', timestamp: Date.now() - 86400000 },
  { id: '3', type: 'in', amount: '400.00', currency: 'ZAR', description: 'Pet Sitting Bonus', timestamp: Date.now() - 172800000 },
  { id: '4', type: 'out', amount: '39.99', currency: 'ZAR', description: 'TimeGiG Top-up 100c', timestamp: Date.now() - 259200000 },
];

const TOPUP_OPTIONS = {
  '10 days': [
    { label: '10c', price: 'R5.00' },
    { label: '20c', price: 'R10.00' },
    { label: '50c', price: 'R15.00' }
  ],
  '30 days': [
    { label: '100c', price: 'R39.99' },
    { label: '200c', price: 'R49.99' },
    { label: '450c', price: 'R59.99' }
  ]
};

export function WalletView({ onNavigate, payments, setPayments, balance }: { onNavigate: (view: 'Helper' | 'GiGs' | 'Cwallet' | 'Profile') => void, payments: Payment[], setPayments: React.Dispatch<React.SetStateAction<Payment[]>>, balance: number }) {
  const [soundEnabled, setSoundEnabledState] = useState(isSoundEnabled());
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked);
    setSoundEnabledState(checked);
    if (checked) {
      setTimeout(() => playSoftClick(), 40);
    }
  };

  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const downloadStatementFile = () => {
    const title = `=========================================================\n` +
                  `              TIMEGIG OFFICIAL DIGITAL STATEMENT         \n` +
                  `=========================================================\n\n` +
                  `Date Generated:  ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n` +
                  `Cardholder:      21LUCIHANOMATTHEWS\n` +
                  `Preferred Email: 21lucihanomatthews@gmail.com\n` +
                  `Active Balance:  ${balance} COINS\n` +
                  `Ecosystem ID:    TIMEGIG-823072152260-SECURE\n` +
                  `Status:          VERIFIED ONLINE CLIENT\n\n` +
                  `------------------- RECORDED TRANSACTION LEDGER -------------------\n\n` +
                  `DATE & TIME          TX REF         DESCRIPTION                          AMOUNT       CURRENCY   STATUS\n` +
                  `-------------------------------------------------------------------------------------------------\n`;
    
    let ledger = "";
    
    const allTxs = [
      ...TRANSACTIONS.map(tx => ({
        timestamp: tx.timestamp,
        id: `TX-00${tx.id}`,
        description: tx.description,
        amount: `${tx.type === 'in' ? '+' : '-'}${tx.amount}`,
        currency: tx.currency,
        status: "APPROVED"
      })),
      ...payments.map(p => ({
        timestamp: p.timestamp,
        id: `PMT-${p.id.slice(-4)}`,
        description: `Top-up Option: ${p.option}`,
        amount: `-${p.price.replace(/R| |Rands/, '')}`,
        currency: "ZAR",
        status: p.status.toUpperCase()
      }))
    ];

    allTxs.sort((a, b) => b.timestamp - a.timestamp);

    allTxs.forEach((tx) => {
      const dateStr = new Date(tx.timestamp).toLocaleString();
      const paddedDate = dateStr.padEnd(20);
      const paddedId = tx.id.padEnd(14);
      const paddedDesc = tx.description.slice(0, 35).padEnd(36);
      const paddedAmount = tx.amount.padStart(12);
      const paddedCurrency = tx.currency.padStart(10);
      const paddedStatus = `   ${tx.status}`;
      ledger += `${paddedDate} ${paddedId} ${paddedDesc} ${paddedAmount} ${paddedCurrency}   ${paddedStatus}\n`;
    });

    const footer = `\n-------------------------------------------------------------------------------------------------\n` +
                   `Total Coins Account Balance Available: ${balance} COINS\n` +
                   `=========================================================\n` +
                   `                Matthews Corporate Finance               \n` +
                   `=========================================================\n`;

    const fullText = title + ledger + footer;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TimeGiG_Statement_${new Date().toISOString().slice(0,10)}.txt`;
    link.referrerPolicy = "no-referrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Statement successfully generated, compiled, and downloaded! Additionally, a copy of the receipt was transmitted to 21lucihanomatthews@gmail.com.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopy = (text: string, category: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(category);
    setTimeout(() => setCopiedText(null), 1500);
  };

  const handleSubmit = () => {
    const newPayment: Payment = {
      id: Date.now().toString(),
      user: 'User',
      option: selectedOption.label,
      price: selectedOption.price,
      status: 'pending',
      timestamp: Date.now(),
      proofUrl: proofUrl || undefined
    };
    setPayments([...payments, newPayment]);
    setIsReviewing(true);
    setTimeout(() => {
      setIsTopUpOpen(false);
      setShowPayment(false);
      setIsReviewing(false);
      setProofUrl(null);
      onNavigate('GiGs');
    }, 2000);
  };

  return (
    <div className="bg-slate-50/50 h-full overflow-y-auto pb-24">
      {/* Top Banner layout */}
      <div className="bg-white p-6 border-b border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, rotate: 10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-14 h-14 flex-shrink-0 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"
          >
            <Wallet className="text-white" size={26} />
          </motion.div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">DIGITAL COIN ACCOUNT</span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              TimeGiG
            </h1>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsTopUpOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95 uppercase tracking-wider"
          >
            <Plus size={14} /> Buy Coins
          </button>
          <button onClick={() => alert('Balances updated successfully!')} className="flex items-center justify-center p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:bg-slate-50 shadow-sm transition-all text-xs font-bold gap-1">
            <RefreshCw size={14} className="text-slate-400" /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Visa-style premium card component & simple stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Glass credit card */}
          <div className="lg:col-span-1 relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 rounded-3xl text-white shadow-2xl shadow-blue-950/20 overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black tracking-widest text-blue-400 uppercase">TIMEGIG ECOSYSTEM</span>
                <h4 className="text-xl font-black tracking-tight mt-1 text-slate-100">TimeGiG Card</h4>
              </div>
              <CreditCard size={24} className="text-blue-400" />
            </div>

            <div className="mt-8">
              <span className="text-[9px] font-black text-slate-400 tracking-widest block uppercase">ACTIVE BALANCE</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-4xl font-black tracking-tight tabular-nums">{balance}</span>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">COINS</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-slate-400 font-medium font-mono">
              <div>
                <span className="text-[8px] font-black block tracking-widest uppercase text-slate-500">CARDHOLDER</span>
                <span className="text-slate-200">21LUCIHANOMATTHEWS</span>
              </div>
              <div>
                <span className="text-[8px] font-black block tracking-widest uppercase text-slate-500">EXPIRES</span>
                <span className="text-slate-200">06 / 29</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics columns times 2 */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <ArrowDownLeft size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 tracking-wider block uppercase">TOTAL REWARDS IN</span>
                <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">R 650.00</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 mt-3 flex items-center gap-1">
                +14.5% versus last week
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-4 right-4 w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-bold">
                <ArrowUpRight size={18} />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-400 tracking-wider block uppercase">TOTAL EXPENDITURES</span>
                <h4 className="text-3xl font-black text-slate-900 mt-2 tracking-tight">R 54.99</h4>
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1">
                Transaction flat fees included
              </span>
            </div>
          </div>
        </div>

        {/* Charts & Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts Curve panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[340px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-black text-sm text-slate-900 tracking-tight">Growth Trend Analytics</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">LAST 7 DAYS</span>
              </div>
              <p className="text-xs text-slate-500 font-semibold">Track historical rewards in Coins value daily</p>
            </div>

            <div className="w-full h-[210px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="curveColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} fontStyle="bold" axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', fontFamily: 'Inter, sans-serif' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#curveColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Transactions Log side */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-black text-sm text-slate-900 tracking-tight mb-4">Transactions Log</h3>
              
              <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1 no-scrollbar">
                {TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center relative ${
                        tx.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                      }`}>
                        <Activity size={16} />
                        <div className={`absolute -right-0.5 -bottom-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white ${
                          tx.type === 'in' ? 'bg-emerald-500' : 'bg-red-500'
                        }`}>
                          {tx.type === 'in' ? <ArrowDownLeft size={8} className="text-white" /> : <ArrowUpRight size={8} className="text-white" />}
                        </div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs group-hover:text-blue-600 transition-colors">{tx.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold block mt-0.5 uppercase">
                          {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • APPROVED
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black text-xs tabular-nums ${tx.type === 'in' ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {tx.type === 'in' ? '+' : '-'}{tx.amount}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 tracking-wider uppercase">{tx.currency}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={downloadStatementFile} className="w-full mt-6 py-3 text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors uppercase tracking-widest border border-slate-100">
              Download Statement
            </button>

            {/* Sound Feedback Control Toggle Switch */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${soundEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                  {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </div>
                <div>
                  <span className="text-[9px] font-black text-slate-400 tracking-wider block uppercase">Tactile Sounds</span>
                  <span className="text-[11px] font-bold text-slate-700 block">Typing & Click Effects</span>
                </div>
              </div>
              <button 
                onClick={() => handleToggleSound(!soundEnabled)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                  soundEnabled 
                    ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-50' 
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
                title={soundEnabled ? "Mute interactive click sound effects" : "Enable tactile sound feedback"}
              >
                {soundEnabled ? '● ON' : '○ MUTED'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Select Buy Option & Secure Payment overlay */}
      <FullScreenModal isOpen={isTopUpOpen} onClose={() => { setIsTopUpOpen(false); setShowPayment(false); setIsReviewing(false); }}>
        {isReviewing ? (
          <div className="text-center p-12">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle className="text-blue-600" size={36} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Uploading Payment Proof</h2>
            <p className="text-slate-500 text-sm mt-1">Matthews' verification team is scanning document details now...</p>
          </div>
        ) : showPayment ? (
          <div className="p-6">
            <h2 className="text-xl font-black text-slate-900 mb-2">Secure Top-up Deposit</h2>
            <p className="text-slate-500 text-xs mb-5 font-semibold">Please run a Capitec Bank transaction to the following coordinates and upload proof.</p>
            
            <div className="bg-slate-950 p-5 rounded-3xl text-white space-y-3.5 relative overflow-hidden mb-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">CAPITEC RECIPIENT BANK</span>
              
              <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-1 text-slate-300">
                <div className="p-2 border border-white/5 rounded-xl bg-white/5 flex flex-col gap-1 relative group">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Bank Brand</span>
                  <span className="font-bold text-slate-100">Capitec Bank</span>
                </div>
                <div className="p-2 border border-white/5 rounded-xl bg-white/5 flex flex-col gap-1 relative group">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider block">Account Holder</span>
                  <span className="font-bold text-slate-100">Matthews Corp</span>
                </div>
                <div onClick={() => handleCopy('1334067366', 'holder')} className="p-2 border border-white/5 rounded-xl bg-white/5 flex flex-col gap-1 relative group cursor-pointer hover:bg-white/10 transition-colors col-span-2">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider block flex justify-between">
                    Account Number <Copy size={10} className="text-slate-400" />
                  </span>
                  <span className="font-bold text-slate-100">1334 0673 66</span>
                  {copiedText === 'holder' && <span className="absolute right-2 bottom-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Copied!</span>}
                </div>
                <div onClick={() => handleCopy(selectedOption?.label, 'ref')} className="p-2 border border-white/5 rounded-xl bg-white/5 flex flex-col gap-1 relative group cursor-pointer hover:bg-white/10 transition-colors col-span-2">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider block flex justify-between">
                    Transaction Reference <Copy size={10} className="text-slate-400" />
                  </span>
                  <span className="font-bold text-blue-400 tracking-wider font-semibold uppercase">{selectedOption?.label} ({selectedOption?.price} Rands)</span>
                  {copiedText === 'ref' && <span className="absolute right-2 bottom-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded">Copied!</span>}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black tracking-wider text-slate-400 uppercase mb-2">Upload POP File</label>
                <input 
                  type="file" 
                  id="pop-uploader"
                  onChange={handleFileUpload} 
                  accept="image/*,application/pdf"
                  className="hidden" 
                />
                <button 
                  onClick={() => document.getElementById('pop-uploader')?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-5 font-semibold text-xs text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <Upload size={24} className="mb-2" />
                  <span>Choose PDF / Image from Files</span>
                </button>
                {proofUrl && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center gap-2 border border-blue-100 text-xs font-bold text-blue-700">
                    <CheckCircle size={16} /> pop_document_completed_receipt.png selected
                  </div>
                )}
              </div>

              <button
                disabled={!proofUrl}
                onClick={handleSubmit}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black tracking-wider uppercase rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1"
              >
                Submit Payment For Review <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-black text-slate-900 mb-2">Select Coins Package</h2>
            <p className="text-slate-400 text-xs mb-6 font-semibold">Coins expire safely within specified parameters.</p>
            
            <div className="space-y-6">
              {Object.entries(TOPUP_OPTIONS).map(([key, options]) => (
                <div key={key}>
                  <h3 className="font-black text-slate-400 text-10px uppercase tracking-wider mb-2">Expire In {key}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {options.map(opt => (
                      <button 
                        key={opt.label} 
                        onClick={() => { setSelectedOption(opt); setShowPayment(true); }} 
                        className="p-4 border border-slate-200/80 rounded-2xl hover:border-blue-500 bg-white hover:bg-blue-50/20 text-left transition-all group flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase">PACKAGE</div>
                          <div className="text-xl font-black text-slate-900 tracking-tight mt-1">{opt.label}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg">{opt.price}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </FullScreenModal>
    </div>
  );
}
