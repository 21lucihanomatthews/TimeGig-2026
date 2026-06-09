/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HelperView } from './components/HelperView';
import { GigsView } from './components/GigsView';
import { WalletView } from './components/WalletView';
import { AdminView } from './components/AdminView';
import { ProfileView } from './components/ProfileView';
import { ChatView } from './components/ChatView';
import { View, Payment, UserProfile } from './types';

import { motion, AnimatePresence } from 'motion/react';
import { UserCog, User } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Helper');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(1500);
  const [profit, setProfit] = useState<number>(0);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'User',
    email: 'user@example.com',
    schoolLevel: 'University',
    workExperiences: [],
    references: [],
    certificateUrls: [],
    idDocumentUrls: [],
    isVerified: false
  });

  return (
    <div id="app-container" className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-40 bg-white/80 backdrop-blur-sm">
        <h1 className="text-xl font-black">Cwallet</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentView('Profile')} className="p-2 bg-gray-100 rounded-full">
            {profile.facePictureUrl ? (
              <img src={profile.facePictureUrl} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </button>
          <button onClick={() => setCurrentView('Admin')} className="p-2 bg-gray-100 rounded-full"><UserCog size={20} /></button>
        </div>
      </header>
      
      <main id="main-content" className="pt-16 pb-32 min-h-screen flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 w-full"
          >
            {currentView === 'Helper' && <HelperView />}
            {currentView === 'GiGs' && <GigsView />}
            {currentView === 'Chat' && <ChatView />}
            {currentView === 'Cwallet' && <WalletView onNavigate={setCurrentView} payments={payments} setPayments={setPayments} balance={balance} />}
            {currentView === 'Admin' && <AdminView payments={payments} setPayments={setPayments} setBalance={setBalance} profit={profit} setProfit={setProfit} />}
            {currentView === 'Profile' && <ProfileView profile={profile} setProfile={setProfile} />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <Navbar currentView={currentView} onNavigate={setCurrentView} />
      
      {/* Visual background accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] bg-blue-50/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] -right-[5%] w-[400px] h-[400px] bg-indigo-50/20 rounded-full blur-[100px]" />
      </div>
    </div>
  );
}

