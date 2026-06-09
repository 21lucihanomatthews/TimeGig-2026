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
import { UserCog, User, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('Helper');
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [balance, setBalance] = useState<number>(1800);
  const [profit, setProfit] = useState<number>(39.99);
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Lucihano',
    surname: 'Matthews',
    email: '21lucihanomatthews@gmail.com',
    location: 'Rondebosch, Cape Town',
    schoolLevel: 'University senior physical sciences',
    contactInfo: '+27 (0) 72 133 4067',
    workExperiences: [
      { title: 'Peer tutor maths physics', company: 'Matthews Private Academy', duration: '12 months' },
      { title: 'Animal daycare caretaker', company: 'Woof sitting Claremont', duration: '6 months' }
    ],
    references: [
      { name: 'Dr. Gregory van Wyk', contact: 'g.vanwyk@stb.ac.za' }
    ],
    certificateUrls: ['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=300'],
    idDocumentUrls: ['https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=300'],
    isVerified: true
  });

  return (
    <div id="app-container" className="min-h-screen bg-slate-50/35 relative font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Dynamic top bar, styled for elegant desktop/mobile presentation */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div />
        
        <div className="flex items-center gap-2">
          {/* Operator mode dashboard pill */}
          <button 
            onClick={() => {
              setCurrentView('Admin');
              setIsNavbarVisible(true);
            }} 
            className={`p-2 rounded-xl transition-all border flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${
              currentView === 'Admin' 
                ? 'bg-red-50 text-red-600 border-red-200' 
                : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-800'
            }`}
            title="Operator Panel"
          >
            <UserCog size={15} />
            <span className="hidden sm:inline">Operator Panel</span>
          </button>

          {/* User profile button */}
          <button 
            onClick={() => {
              setCurrentView('Profile');
              setIsNavbarVisible(true);
            }} 
            className={`p-1.5 rounded-full transition-all border ${
              currentView === 'Profile' 
                ? 'ring-2 ring-blue-600 border-white bg-blue-50' 
                : 'border-slate-200/50 bg-slate-105 hover:bg-slate-100'
            }`}
          >
            {profile.facePictureUrl ? (
              <img src={profile.facePictureUrl} className="w-7 h-7 rounded-full object-cover shadow-sm" alt="My Profile avatar" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                <User size={14} />
              </div>
            )}
          </button>
        </div>
      </header>
      
      {/* Views routing container */}
      <main id="main-content" className={`pt-16 flex flex-col ${
        currentView === 'Chat' 
          ? (isNavbarVisible ? 'h-[calc(100vh-9rem)] pb-0' : 'h-[calc(100vh-4rem)] pb-0') 
          : 'pb-20 min-h-screen'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            className="flex-1 w-full"
          >
            {currentView === 'Helper' && <HelperView profile={profile} />}
            {currentView === 'GiGs' && <GigsView />}
            {currentView === 'Chat' && (
              <ChatView 
                isNavbarVisible={isNavbarVisible} 
                setIsNavbarVisible={setIsNavbarVisible} 
              />
            )}
            {currentView === 'Cwallet' && <WalletView onNavigate={setCurrentView} payments={payments} setPayments={setPayments} balance={balance} />}
            {currentView === 'Admin' && <AdminView payments={payments} setPayments={setPayments} setBalance={setBalance} profit={profit} setProfit={setProfit} />}
            {currentView === 'Profile' && <ProfileView profile={profile} setProfile={setProfile} />}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Premium floating tab navbar */}
      <AnimatePresence>
        {isNavbarVisible ? (
          <motion.div
            key="bottom-navbar"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 w-full"
          >
            <Navbar 
              currentView={currentView} 
              onNavigate={(view) => {
                setCurrentView(view);
                setIsNavbarVisible(false);
              }} 
            />
          </motion.div>
        ) : (
          currentView !== 'Chat' && (
            <motion.button
              key="show-navbar"
              initial={{ y: 50, opacity: 0, x: "-50%" }}
              animate={{ y: 0, opacity: 1, x: "-50%" }}
              exit={{ y: 50, opacity: 0, x: "-50%" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsNavbarVisible(true)}
              className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl border border-slate-250 hover:border-slate-300 shadow-xl px-5 py-2.5 rounded-full flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-wider hover:bg-slate-50 transition-all duration-200 z-50 cursor-pointer"
            >
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
              <span>Show Menu</span>
            </motion.button>
          )
        )}
      </AnimatePresence>
      
      {/* High-contrast smooth ambient glows */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[450px] h-[450px] bg-blue-100/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[20%] -right-[10%] w-[450px] h-[450px] bg-emerald-100/10 rounded-full blur-[140px]" />
      </div>
    </div>
  );
}
