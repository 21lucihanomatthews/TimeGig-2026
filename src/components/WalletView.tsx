import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Activity, RefreshCw, CheckCircle, User } from 'lucide-react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { WalletTransaction, WalletBalance, Payment } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';

const MOCK_DATA = [
  { day: 'Mon', balance: 1200 },
  { day: 'Tue', balance: 1900 },
  { day: 'Wed', balance: 1550 },
  { day: 'Thu', balance: 2400 },
  { day: 'Fri', balance: 2100 },
  { day: 'Sat', balance: 3200 },
  { day: 'Sun', balance: 2850 },
];

const TRANSACTIONS: WalletTransaction[] = [
  { id: '1', type: 'in', amount: '850.00', currency: 'CWT', description: 'React Audit Payment', timestamp: Date.now() - 3600000 },
  { id: '2', type: 'out', amount: '12.50', currency: 'USDC', description: 'Platform Fee', timestamp: Date.now() - 86400000 },
  { id: '3', type: 'in', amount: '2.1', currency: 'ETH', description: 'Figma Design Bonus', timestamp: Date.now() - 172800000 },
];

const BALANCES: WalletBalance[] = [
  { currency: 'ZAR', amount: '1,500.00' },
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
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

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
        onNavigate('GiGs');
    }, 2000);
  };

  return (
    <div className="bg-gray-50/50 h-full overflow-y-auto overflow-x-hidden">
      <div className="p-3 md:p-4 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, rotate: 10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="w-12 h-12 flex-shrink-0 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"
            >
              <Wallet className="text-white" size={24} />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                Cwallet
              </h1>
              <p className="text-gray-500 text-sm mt-0.5 font-medium">Manage your Rands assets.</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
                onClick={() => onNavigate('Profile')}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-all shadow-sm active:scale-95">
              <User size={16} />
            </button>
             <button 
                onClick={() => setIsTopUpOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95">
              Top-up
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm hover:shadow-md active:scale-95 group">
              <RefreshCw size={14} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8 max-w-sm">
            <motion.div
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50/30 rounded-full blur-2xl group-hover:bg-blue-100/40 transition-colors" />
              <div className="flex items-center gap-3 mb-4">
                <div className={'p-2 rounded-xl bg-blue-600 text-white'}>
                   <Activity size={20} />
                </div>
                <span className="font-black text-gray-900 text-sm tracking-tight">Coins Balance</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 tabular-nums">
                {balance.toFixed(0)}
              </h2>
            </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[320px]">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center justify-between">
              Growth Analytics
              <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">Last 7 Days</span>
            </h3>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_DATA}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 mb-6">Recent Transactions</h3>
            <div className="space-y-4 flex-1 overflow-y-auto">
              {TRANSACTIONS.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center relative ${
                      tx.type === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {tx.currency === 'ETH' ? <Activity size={16} /> : <Activity size={16} />}
                      <div className={`absolute -right-0.5 -bottom-0.5 w-4 h-4 rounded-full flex items-center justify-center border border-white ${
                        tx.type === 'in' ? 'bg-emerald-500' : 'bg-orange-500'
                      }`}>
                        {tx.type === 'in' ? <ArrowDownLeft size={8} className="text-white" /> : <ArrowUpRight size={8} className="text-white" />}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-xs group-hover:text-blue-600 transition-colors">{tx.description}</p>
                      <p className="text-[9px] text-gray-400 font-mono mt-0.5 tracking-tighter uppercase font-semibold">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-xs tabular-nums ${tx.type === 'in' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.type === 'in' ? '+' : '-'}{tx.amount}
                    </p>
                    <p className="text-[9px] font-black text-gray-400 tracking-widest uppercase">{tx.currency}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2 text-[10px] font-bold text-gray-400 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-widest">
              View All History
            </button>
          </div>
        </div>
      </div>

      <FullScreenModal isOpen={isTopUpOpen} onClose={() => { setIsTopUpOpen(false); setShowPayment(false); setIsReviewing(false); }}>
        {isReviewing ? (
            <div className="text-center p-10">
                <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
                <h2 className="text-2xl font-bold">Review in Progress</h2>
                <p className="text-gray-500">Redirecting to Gigs...</p>
            </div>
        ) : showPayment ? (
            <div className="p-4">
                <h2 className="text-xl font-bold mb-4">Payment Details</h2>
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <p>Bank: Capitec</p>
                    <p>Account Name: Matthews</p>
                    <p>Account Number: 1334067366</p>
                    <p className="font-bold">Ref: {selectedOption.label}</p>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Upload Proof of Payment</label>
                    <input type="file" onChange={handleFileUpload} className="w-full" />
                </div>
                <button
                    onClick={handleSubmit}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95">
                    Submit
                </button>
            </div>
        ) : (
            <div className="p-4 space-y-4">
                <h2 className="text-xl font-bold mb-4">Select Option</h2>
                {Object.entries(TOPUP_OPTIONS).map(([key, options]) => (
                    <div key={key}>
                        <h3 className="font-bold text-gray-400 text-xs uppercase mb-2">Expire in {key}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {options.map(opt => (
                                <button key={opt.label} onClick={() => { setSelectedOption(opt); setShowPayment(true); }} className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 text-xs font-bold">
                                    {opt.label} {opt.price}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </FullScreenModal>
    </div>
  );
}
