import React, { useState, useEffect } from 'react';
import { MarketItem, UserProfile, View } from '../types';
import LiveStorageService from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  MapPin, 
  Tag, 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Trash2, 
  User, 
  X, 
  ChevronRight, 
  Info,
  DollarSign
} from 'lucide-react';
import { SimpleModal } from './SimpleModal';

interface MarketViewProps {
  profile: UserProfile;
  onAddNotification: (title: string, message: string, type: 'gig' | 'promotion' | 'system') => void;
  setChatTargetSellerEmail: (email: string) => void;
  setCurrentView: (view: View) => void;
}

const CATEGORIES = ['All Items', 'Textbooks & Notes', 'Study Tools', 'Electronics & Tech', 'Clothes & Style', 'Bicycles & Rides', 'Shared Rooms', 'Food & Snacks', 'Other Items'];

// Seed some initial cool student/freelance marketplace items
const INITIAL_MARKET_ITEMS: MarketItem[] = [
  {
    id: 'market-1',
    title: 'University Math 1A Textbook (Calculus)',
    description: 'Perfect condition calculus textbook with solved past exams papers. Essential for first-year sciences and engineering. Zero pencil marks inside!',
    price: 'R450',
    category: 'Textbooks & Notes',
    status: 'available',
    sellerName: 'Matthews P.',
    sellerEmail: 'matthews@stb.ac.za',
    sellerContact: '+27 71 883 2210',
    location: 'Rondebosch, Cape Town',
    imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=450',
    timestamp: Date.now() - 36000000,
    views: 124,
    interestedCount: 12
  },
  {
    id: 'market-2',
    title: 'Sleek Laptop Stand (Verbatim Aluminum)',
    description: 'Foldable metallic stand to save your neck and back posture. Sturdy design, fits up to 16 inch laptops. Including protective carrying pouch.',
    price: 'R220',
    category: 'Study Tools',
    status: 'available',
    sellerName: 'Samantha Daniels',
    sellerEmail: 'samantha.d@gmail.com',
    sellerContact: '+27 82 449 1102',
    location: 'Cape Town Central',
    imageUrl: 'https://images.unsplash.com/photo-1527443195645-1133b7f28f1b?w=450',
    timestamp: Date.now() - 86400000,
    views: 89,
    interestedCount: 4
  },
  {
    id: 'market-3',
    title: 'Scientific Calculator Casio fx-991ZA Plus',
    description: 'Highly recommended for physical sciences and financial mathematics exams. Solves matrices, formulas, complex numbers seamlessly. Solarcell battery.',
    price: 'R380',
    category: 'Electronics & Tech',
    status: 'available',
    sellerName: 'Lucihano Matthews',
    sellerEmail: '21lucihanomatthews@gmail.com',
    sellerContact: '+27 72 133 4067',
    location: 'Rondebosch, Cape Town',
    imageUrl: 'https://images.unsplash.com/photo-1574607383476-f517f220d398?w=450',
    timestamp: Date.now() - 172800000,
    views: 204,
    interestedCount: 22
  },
  {
    id: 'market-4',
    title: 'Sturmey-Archer 3-Speed Vintage Bicycle',
    description: 'Perfect daily Cape student commuter bicycle. Back pedal brake, retro classic bell, super smooth tires. Front rack attached to carry books and backpack.',
    price: 'R1,200',
    category: 'Bicycles & Rides',
    status: 'available',
    sellerName: 'Devon K.',
    sellerEmail: 'devon@stb.ac.za',
    sellerContact: '+27 65 993 4451',
    location: 'Stellenbosch Central',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=450',
    timestamp: Date.now() - 259200000,
    views: 55,
    interestedCount: 1
  }
];

export function MarketView({ profile, onAddNotification, setChatTargetSellerEmail, setCurrentView }: MarketViewProps) {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [safetyModalItem, setSafetyModalItem] = useState<MarketItem | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  // Listing Form Fields state
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Textbooks & Notes');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemContact, setNewItemContact] = useState(profile.contactInfo || '');
  const [newItemLocation, setNewItemLocation] = useState(profile.location || 'Cape Point Division');

  useEffect(() => {
    async function fetchItems() {
      const data = await LiveStorageService.getMarketItems(INITIAL_MARKET_ITEMS);
      setItems(data);
    }
    fetchItems();
  }, []);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !newItemPrice.trim()) return;

    // Default premium student photos if empty
    let placeholderImg = newItemImage.trim();
    if (!placeholderImg) {
      if (newItemCategory.includes('Textbook')) {
        placeholderImg = 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=450';
      } else if (newItemCategory.includes('Tech') || newItemCategory.includes('Electronic')) {
        placeholderImg = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=450';
      } else if (newItemCategory.includes('Clothes')) {
        placeholderImg = 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=450';
      } else {
        placeholderImg = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=450';
      }
    }

    const priceWithCurrency = newItemPrice.startsWith('R') ? newItemPrice : `R${newItemPrice}`;

    const listing: MarketItem = {
      id: `market-${Date.now()}`,
      title: newItemTitle,
      description: newItemDesc,
      price: priceWithCurrency,
      category: newItemCategory,
      status: 'available',
      sellerName: `${profile.name} ${profile.surname || ''}`.trim() || 'Verified Gigger',
      sellerEmail: profile.email,
      sellerContact: newItemContact || '+27 72 133 4067',
      location: newItemLocation,
      imageUrl: placeholderImg,
      timestamp: Date.now(),
      views: 0,
      interestedCount: 0
    };

    const updated = [listing, ...items];
    setItems(updated);
    await LiveStorageService.saveMarketItem(listing);

    onAddNotification(
      'New Item Listed! 📦',
      `Your "${newItemTitle}" was published to the local Student Market for ${priceWithCurrency}.`,
      'promotion'
    );

    // Reset Form & state
    setNewItemTitle('');
    setNewItemDesc('');
    setNewItemPrice('');
    setNewItemImage('');
    setIsPosting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleToggleSold = async (id: string) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'available' ? 'sold' : 'available';
        const changedObj = { ...item, status: nextStatus as 'available' | 'sold' };
        LiveStorageService.saveMarketItem(changedObj);
        return changedObj;
      }
      return item;
    });
    setItems(updated);
    
    const targetItem = items.find(i => i.id === id);
    if (targetItem && targetItem.status === 'available') {
      onAddNotification(
        'Item Sold! 🎉',
        `Congrats on selling "${targetItem.title}"! We have updated the marketplace listing.`,
        'system'
      );
    }
  };

  const handleDeleteListing = async (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    await LiveStorageService.deleteMarketItem(id);
  };

  // Safe Filter Logic
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'All Items' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50/50 select-none">
      {/* Search Header Banner */}
      <div className="bg-white px-5 py-3 border-b border-slate-100 shadow-sm sticky top-0 z-30 backdrop-blur-md bg-white/95 flex-shrink-0">
        <div className="flex justify-between items-center gap-4 mb-2.5">
          <div>
            <span className="text-[10px] font-extrabold tracking-wider text-purple-650 uppercase">STUDENT TRADING</span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Buy & Sell Market</h1>
          </div>
          
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-sm shadow-purple-200 cursor-pointer"
          >
            <Plus size={12} />
            Post Item
          </button>
        </div>

        {/* Search bar inside header panel */}
        <div className="relative mt-2">
          <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
          <input 
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Search textbooks, calculators, monitors, rides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Easy horizontal slider categories scroll */}
        <div className="flex gap-1.5 overflow-x-auto py-2 no-scrollbar scroll-smooth -mx-2 px-2 mt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-550 hover:bg-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-4 py-4 pb-36">
        {/* Helper callout for marketplace rules */}
        <div className="bg-purple-50/60 border border-purple-100/60 rounded-2xl p-3.5 mb-5 flex gap-2.5 items-start">
          <Info size={16} className="text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-purple-800 font-semibold leading-relaxed">
            <span className="font-extrabold text-purple-900 block uppercase tracking-wider text-[9px] mb-0.5">Campus Direct Bargain Marketplace</span>
            Cash/EFT, hand-to-hand trades or CWT digital transfers. No shipping scams, check everything during meetup. Free listings for Cape giggers.
          </div>
        </div>

        {/* Post Form (Collapsible with smooth slide animation) */}
        <AnimatePresence>
          {isPosting && (
            <motion.form 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleCreateListing}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 mb-6 shadow-md overflow-hidden"
            >
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-purple-700 tracking-wider">Create Marketplace Listing</span>
                <button 
                  type="button" 
                  onClick={() => setIsPosting(false)}
                  className="p-1 hover:bg-slate-105 rounded-xl text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Item Title *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Apple iPad Air 4th Gen for lecture notes" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Item Description</label>
                    <textarea 
                      placeholder="Describe what state it is in, features, etc. Keep it clear for student buyers..." 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 min-h-[80px]"
                      value={newItemDesc}
                      onChange={(e) => setNewItemDesc(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Price (e.g., 250) *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Price in R or CWT" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                        value={newItemPrice}
                        onChange={(e) => setNewItemPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Category</label>
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800"
                        value={newItemCategory}
                        onChange={(e) => setNewItemCategory(e.target.value)}
                      >
                        {CATEGORIES.filter(c => c !== 'All Items').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Photo Image URLs (comma separated)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., url1, url2, url3" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                      value={newItemImage}
                      onChange={(e) => setNewItemImage(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Meetup Area / Camp Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Rondebosch Campus / Stellenbosch Library" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                      value={newItemLocation}
                      onChange={(e) => setNewItemLocation(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-black tracking-wider text-slate-400 mb-1">Your Contact number *</label>
                    <input 
                      type="text" 
                      placeholder="Leave cell / Whatsapp for transactions" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400"
                      value={newItemContact}
                      onChange={(e) => setNewItemContact(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsPosting(false)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer"
                >
                  Publish and List
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Listings Grid - marketplace layout simple for dummies */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-sm">
            <ShoppingBag className="mx-auto text-slate-300 stroke-1 mb-3 animate-bounce" size={42} />
            <h3 className="font-extrabold text-slate-800 text-sm">No items match your trade search</h3>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
              Try selection of different trading filter or create first listing of items yourself!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredItems.map((item) => {
              const ofSelf = item.sellerEmail === profile.email;
              return (
                <motion.div
                  key={item.id}
                  layoutId={`market-card-${item.id}`}
                  className="bg-white rounded-[24px] border border-slate-205 overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col group relative"
                >
                  {/* Status Overlay ribbon */}
                  {item.status === 'sold' ? (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-15 shadow">
                      Sold out
                    </div>
                  ) : (
                    <div className="absolute top-3 left-3 bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full z-15 shadow">
                      Available
                    </div>
                  )}

                  {/* Self-Indicator badge */}
                  {ofSelf && (
                    <span className="absolute top-3 right-3 bg-slate-900 border border-slate-800 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg z-15">
                      Your Listing
                    </span>
                  )}

                  {/* Thumbnail Cover */}
                  <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden flex-shrink-0">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=450';
                      }}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${item.status === 'sold' ? 'filter grayscale opacity-60' : ''}`}
                    />
                    
                    {/* Floating Price tag */}
                    <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl text-white text-xs font-black shadow-lg">
                      {item.price}
                    </div>
                  </div>

                  {/* Card Content body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-purple-600">
                        {item.category}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-0.5 leading-snug group-hover:text-purple-700 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {/* Location, Seller Info, and Stats */}
                      <div className="flex flex-col gap-2 text-[10px] text-slate-400 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-0.5 truncate max-w-[120px] font-bold">
                            <MapPin size={11} className="text-slate-350" />
                            {item.location.split(',')[0]}
                          </span>
                          
                          <span className="font-bold text-slate-550 flex items-center gap-1">
                            <User size={10} className="text-slate-350" />
                            By {ofSelf ? 'You' : item.sellerName.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-slate-400">
                          <span>{item.views} Views</span>
                          <span>{item.interestedCount} Interested</span>
                        </div>
                      </div>

                      {/* Interactive Buttons for Bargains */}
                      {ofSelf ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleSold(item.id)}
                            className={`flex-1 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-colors border cursor-pointer ${
                              item.status === 'sold'
                                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                                : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                            }`}
                          >
                            {item.status === 'sold' ? 'Mark Available' : 'Mark Sold'}
                          </button>
                          
                          <button
                            onClick={() => {
                              if(confirm("Confirm deletion of marketplace listing?")) {
                                handleDeleteListing(item.id);
                              }
                            }}
                            className="p-1 px-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSafetyModalItem(item);
                            setShowSafetyModal(true);
                          }}
                          disabled={item.status === 'sold'}
                          className={`w-full py-2 rounded-xl text-[11px] font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer ${
                            item.status === 'sold'
                              ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm shadow-purple-200'
                          }`}
                        >
                          {item.status === 'sold' ? 'Sold out' : 'Contact Seller'}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Easy Marketplace Popover Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-55 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ y: 250, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 250, opacity: 0 }}
              className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-100"
            >
              {/* Modal Banner */}
              <div className="relative aspect-[16/10] bg-slate-100">
                <img 
                  src={selectedItem.imageUrl} 
                  alt={selectedItem.title} 
                  className="w-full h-full object-cover"
                />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white p-1.5 rounded-full transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-4 left-4 bg-purple-600 text-white px-3 font-bold py-1.5 rounded-xl text-xs sm:text-sm">
                  {selectedItem.price}
                </div>
              </div>

              {/* Modal scroll body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    {selectedItem.category}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1 leading-snug">
                    {selectedItem.title}
                  </h2>
                </div>

                <div className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="font-extrabold text-[10px] text-slate-400 uppercase tracking-wider block mb-1">Product Description</span>
                  {selectedItem.description}
                </div>

                {/* Seller Detail Block */}
                <div className="p-4 bg-purple-50/50 border border-purple-100/30 rounded-2xl space-y-3">
                  <span className="font-black text-[10px] text-purple-700 uppercase tracking-wider block">Seller Meetup & Deal Detail</span>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <User size={14} className="text-purple-500" />
                      <span className="font-bold">Name: {selectedItem.sellerName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <MapPin size={14} className="text-purple-500" />
                      <span className="font-bold">Location: {selectedItem.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Phone size={14} className="text-purple-500" />
                      <span className="font-bold">Contact: {selectedItem.sellerContact}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Mail size={14} className="text-purple-500" />
                      <span className="font-bold">Email: {selectedItem.sellerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Action deals quick copy */}
                <div className="flex gap-2 pt-2">
                  <a 
                    href={`tel:${selectedItem.sellerContact}`}
                    className="flex-1 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl text-center shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Phone size={14} />
                    Call Seller
                  </a>

                  <a 
                    href={`https://wa.me/${selectedItem.sellerContact.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider py-3.5 rounded-xl text-center shadow shadow-emerald-200 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                  >
                    Quick Chat
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SimpleModal
        isOpen={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
        title="Safety First: Meetup Confirmation"
      >
        {safetyModalItem && (
          <div className="space-y-4">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed">
              <div className="flex items-center gap-2 mb-2">
                <Info size={18} className="flex-shrink-0" />
                <span>Safety Warning: Risk Assessment</span>
              </div>
              <p>Trading with users who lack a verified face picture on their profile carries inherent risks. Always conduct meetups in public areas and verify identity in person before exchanging items.</p>
            </div>
            <p className="text-sm text-slate-700">
              Are you sure you want to contact {safetyModalItem.sellerName}?
            </p>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="share-id" className="rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
              <label htmlFor="share-id" className="text-xs font-semibold text-slate-600">
                Grant permission to securely share my ID document for verification.
              </label>
            </div>
            <button
              onClick={() => {
                setChatTargetSellerEmail(safetyModalItem.sellerEmail);
                setCurrentView('Chat');
                setShowSafetyModal(false);
              }}
              className="w-full bg-purple-600 text-white font-bold p-3 rounded-xl text-sm hover:bg-purple-700 transition-colors"
            >
              Contact Seller
            </button>
          </div>
        )}
      </SimpleModal>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 bg-emerald-600 text-white p-4 rounded-3xl shadow-2xl z-55 flex items-center gap-3"
          >
            <CheckCircle size={24} />
            <div>
              <h4 className="font-bold text-sm">Congratulations!</h4>
              <p className="text-xs text-emerald-100">Your item has been listed successfully.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
