/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type View = 'Helper' | 'GiGs' | 'Cwallet' | 'Admin' | 'Profile' | 'Chat' | 'Market';

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  status?: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
}

export interface Gig {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: 'available' | 'active' | 'completed';
  employer: string;
  image?: string;
  images?: string[];
  startDate?: string;
  endDate?: string;
  workerEmail?: string;
}

export interface Helper {
  id: string;
  name: string;
  profilePic: string;
  faceVideoUrl?: string;
  bio: string;
  contact: string;
  role: string;
  mediaUrls?: string[];
}

export interface PremiumHelper extends Helper {
  rating: string;
  location: string;
  completedTasks: number;
  rate: string;
  availableNow: boolean;
  specialty: string;
  verified: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'in' | 'out';
  amount: string;
  currency: 'CWT' | 'ETH' | 'USDC' | 'COIN' | 'ZAR';
  description: string;
  timestamp: number;
}

export interface WalletBalance {
  currency: 'CWT' | 'ETH' | 'USDC' | 'COIN' | 'ZAR';
  amount: string;
}

export interface Payment {
  id: string;
  user: string;
  option: string;
  price: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  proofUrl?: string;
}

export interface UserProfile {
  name: string;
  surname?: string;
  location?: string;
  contactInfo?: string;
  email: string;
  schoolLevel: string;
  workExperiences: { title: string; company: string; duration: string }[];
  references: { name: string; contact: string }[];
  facePictureUrl?: string;
  faceVideoUrl?: string;
  certificateUrls: string[];
  idDocumentUrls: string[];
  isVerified: boolean;
  registrationDate?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'gig' | 'promotion' | 'system';
  timestamp: number;
  read: boolean;
  meta?: any;
}

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  status: 'available' | 'sold';
  sellerName: string;
  sellerEmail: string;
  sellerContact: string;
  location: string;
  imageUrl?: string;
  timestamp: number;
  views: number;
  interestedCount: number;
}

