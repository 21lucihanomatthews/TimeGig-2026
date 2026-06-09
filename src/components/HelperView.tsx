import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Phone, Mail, Search, Plus, X, Video, Image as ImageIcon } from 'lucide-react';
import { Helper } from '@/src/types';
import { FullScreenModal } from './FullScreenModal';

const HELPERS: Helper[] = [
    { id: '1', name: 'Alice Smith', profilePic: '/src/assets/images/helper_realistic_3d_1780920191933.png', bio: 'Expert gigger.', contact: 'alice@example.com', role: 'Gardener' },
    { id: '2', name: 'Bob Jones', profilePic: '/src/assets/images/ai_helper_3d_icon_1780918951042.png', bio: 'Pet lover.', contact: 'bob@example.com', role: 'Pet Sitter' },
];

export function HelperView() {
  const [selectedHelper, setSelectedHelper] = useState<Helper | null>(null);
  const [search, setSearch] = useState('');
  const [mediaUrls, setMediaUrls] = useState<Record<string, {url: string, type: string}[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, helperId: string) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newMedia = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setMediaUrls(prev => ({
        ...prev,
        [helperId]: [...(prev[helperId] || []), ...newMedia]
      }));
    }
  };

  const filteredHelpers = HELPERS.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 tracking-tighter mb-4">
          Chats
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-100 py-2 pl-10 pr-4 rounded-xl text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4">
          {filteredHelpers.map(helper => (
            <div key={helper.id} className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col gap-2" onClick={() => setSelectedHelper(helper)}>
                <img src={helper.profilePic} alt={helper.name} className="w-full h-32 rounded-xl object-cover" />
                <div>
                     <h3 className="font-bold text-gray-900 truncate">{helper.name}</h3>
                     <p className="text-xs text-gray-500 truncate">{helper.role}</p>
                </div>
            </div>
          ))}
      </div>
      
      <FullScreenModal isOpen={!!selectedHelper} onClose={() => setSelectedHelper(null)}>
        {selectedHelper && (
            <div className="p-6">
                <img src={selectedHelper.profilePic} alt={selectedHelper.name} className="w-32 h-32 rounded-full mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-center">{selectedHelper.name}</h2>
                <p className="text-center text-gray-500 mb-4">{selectedHelper.role}</p>
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <p className="text-gray-700 italic">"{selectedHelper.bio}"</p>
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2"><Phone size={18} /> {selectedHelper.contact}</div>
                    <div className="flex items-center gap-2"><Mail size={18} /> {selectedHelper.contact}</div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">Portfolio</h4>
                        <input type="file" multiple accept="image/*,video/*" ref={fileInputRef} onChange={(e) => handleFileChange(e, selectedHelper.id)} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium">
                            <Plus size={16} /> Upload
                        </button>
                    </div>
                    {mediaUrls[selectedHelper.id] && mediaUrls[selectedHelper.id].length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {mediaUrls[selectedHelper.id].map((media, i) => (
                                <div key={i} className="relative aspect-square">
                                    {media.type.startsWith('image/') ? (
                                        <img src={media.url} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        <video src={media.url} className="w-full h-full object-cover rounded-lg" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => alert(`Hired ${selectedHelper.name}!`)}
                    className="w-full mt-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all active:scale-95"
                >
                    Hire {selectedHelper.name}
                </button>
            </div>
        )}
      </FullScreenModal>
    </div>
  );
}
