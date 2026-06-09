import { createClient } from '@supabase/supabase-js';
import { Gig, NotificationItem, Payment, UserProfile, PremiumHelper, MarketItem } from '../types';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://guzmtlduruhusnqjffph.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- SCHEMA & DATA SYNC UTILITIES ---

/**
 * Generic helper to handle safe mock fallbacks and local storage persistence
 * if Supabase keys are not configured yet, but redirects to Supabase for live users.
 */
class LiveStorageService {
  public static supabase = supabase;

  private static localKey(table: string) {
    return `timegig_supabase_fallback_${table}`;
  }

  static getLocal<T>(table: string, defaults: T[]): T[] {
    try {
      const stored = localStorage.getItem(this.localKey(table));
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn("Storage error", e);
    }
    return defaults;
  }

  static saveLocal<T>(table: string, data: T[]) {
    try {
      localStorage.setItem(this.localKey(table), JSON.stringify(data));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }

  // --- SEED OR GET GIGS ---
  static async getGigs(initialGigs: Gig[]): Promise<Gig[]> {
    if (!supabase) {
      return this.getLocal('gigs', initialGigs);
    }

    try {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('gigs')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('not found') || error.message.includes('does not exist')) {
          // Table doesn't exist yet, fallback to local storage
          console.warn("Supabase gigs table does not exist yet. Please run migration or setup, falling back gracefully.");
          return this.getLocal('gigs', initialGigs);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        // Automatically seed live table if it's currently empty
        const formatted = initialGigs.map(g => ({
          id: g.id,
          title: g.title,
          description: g.description,
          price: g.price,
          category: g.category,
          status: g.status,
          employer: g.employer,
          image: g.image || '',
          images: g.images || [],
          start_date: g.startDate || 'Immediately',
          end_date: g.endDate || '',
          worker_email: g.workerEmail || ''
        }));

        await supabase.from('gigs').insert(formatted);
        return initialGigs;
      }

      // Map back to TypeScript types
      return data.map(item => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        status: item.status,
        employer: item.employer,
        image: item.image,
        images: item.images,
        startDate: item.start_date,
        endDate: item.end_date,
        workerEmail: item.worker_email || ''
      }));
    } catch (err: any) {
      console.error("Supabase Gigs error:", err);
      return this.getLocal('gigs', initialGigs);
    }
  }

  // --- SAVE SINGLE GIG ---
  static async addGig(gig: Gig) {
    if (!supabase) {
      const current = this.getLocal<Gig>('gigs', []);
      const filtered = current.filter(g => g.id !== gig.id);
      const updated = [gig, ...filtered];
      this.saveLocal('gigs', updated);
      return;
    }

    try {
      const { error } = await supabase.from('gigs').upsert([{
        id: gig.id,
        title: gig.title,
        description: gig.description,
        price: gig.price,
        category: gig.category,
        status: gig.status,
        employer: gig.employer,
        image: gig.image || '',
        images: gig.images || [],
        start_date: gig.startDate || 'Immediately',
        end_date: gig.endDate || '',
        worker_email: gig.workerEmail || ''
      }]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase upsert gig error, saving locally:", err);
      const current = this.getLocal<Gig>('gigs', []);
      const filtered = current.filter(g => g.id !== gig.id);
      this.saveLocal('gigs', [gig, ...filtered]);
    }
  }

  // --- SEED OR GET NOTIFICATIONS ---
  static async getNotifications(initialNotifications: NotificationItem[]): Promise<NotificationItem[]> {
    if (!supabase) {
      return this.getLocal('notifications', initialNotifications);
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          return this.getLocal('notifications', initialNotifications);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        // Seed first
        const formatted = initialNotifications.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          timestamp: n.timestamp,
          read: n.read,
          meta: n.meta ? JSON.stringify(n.meta) : null
        }));
        await supabase.from('notifications').insert(formatted);
        return initialNotifications;
      }

      return data.map(item => ({
        id: String(item.id),
        title: item.title,
        message: item.message,
        type: item.type,
        timestamp: Number(item.timestamp),
        read: Boolean(item.read),
        meta: item.meta ? JSON.parse(item.meta) : undefined
      }));
    } catch (err) {
      console.error("Supabase notifications error:", err);
      return this.getLocal('notifications', initialNotifications);
    }
  }

  // --- SAVE SINGLE NOTIFICATION ---
  static async addNotification(notif: NotificationItem) {
    if (!supabase) {
      const current = this.getLocal<NotificationItem>('notifications', []);
      this.saveLocal('notifications', [notif, ...current]);
      return;
    }

    try {
      const { error } = await supabase.from('notifications').insert([{
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        timestamp: notif.timestamp,
        read: notif.read,
        meta: notif.meta ? JSON.stringify(notif.meta) : null
      }]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase add notification error:", err);
      const current = this.getLocal<NotificationItem>('notifications', []);
      this.saveLocal('notifications', [notif, ...current]);
    }
  }

  // --- UPDATE ALL NOTIFICATIONS READ STATUS ---
  static async markAllNotificationsRead() {
    if (!supabase) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('read', false);
    } catch (err) {
      console.error("Supabase clear read error:", err);
    }
  }

  // --- UPDATE SINGLE NOTIFICATION READ ---
  static async markNotificationRead(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
    } catch (err) {
      console.error("Supabase mark read error:", err);
    }
  }

  // --- DELETE NOTIFICATION ---
  static async deleteNotification(id: string) {
    if (!supabase) return;
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.error("Supabase delete notification error:", err);
    }
  }

  // --- GET PROFILE OR CREATE DEFAULT ---
  static async getProfile(email: string, initialProfile: UserProfile): Promise<UserProfile> {
    if (!supabase) {
      const local = localStorage.getItem(`profile_${email}`);
      if (local) return JSON.parse(local);
      return initialProfile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        if (error.message.includes('does not exist')) {
          return initialProfile;
        }
        throw error;
      }

      if (!data) {
        // Insert initial profile row for this user
        const formatted = {
          email: initialProfile.email,
          name: initialProfile.name,
          surname: initialProfile.surname || '',
          location: initialProfile.location || '',
          contact_info: initialProfile.contactInfo || '',
          school_level: initialProfile.schoolLevel || '',
          work_experiences: initialProfile.workExperiences || [],
          references: initialProfile.references || [],
          face_picture_url: initialProfile.facePictureUrl || '',
          certificate_urls: initialProfile.certificateUrls || [],
          id_document_urls: initialProfile.idDocumentUrls || [],
          is_verified: initialProfile.isVerified || false,
          balance: 1800,
          profit: 39.99
        };
        await supabase.from('profiles').insert([formatted]);
        return initialProfile;
      }

      return {
        name: data.name,
        surname: data.surname,
        email: data.email,
        location: data.location,
        contactInfo: data.contact_info,
        schoolLevel: data.school_level,
        workExperiences: typeof data.work_experiences === 'string' ? JSON.parse(data.work_experiences) : data.work_experiences,
        references: typeof data.references === 'string' ? JSON.parse(data.references) : data.references,
        facePictureUrl: data.face_picture_url,
        certificateUrls: typeof data.certificate_urls === 'string' ? JSON.parse(data.certificate_urls) : data.certificate_urls,
        idDocumentUrls: typeof data.id_document_urls === 'string' ? JSON.parse(data.id_document_urls) : data.id_document_urls,
        isVerified: Boolean(data.is_verified)
      };
    } catch (err) {
      console.error("Supabase profile error:", err);
      const local = localStorage.getItem(`profile_${email}`);
      if (local) return JSON.parse(local);
      return initialProfile;
    }
  }

  // --- UPDATE PROFILE ---
  static async updateProfile(profile: UserProfile, balance?: number, profit?: number) {
    // Also save to localStorage for seamless resilience
    localStorage.setItem(`profile_${profile.email}`, JSON.stringify(profile));

    if (!supabase) return;

    try {
      const updateData: any = {
        name: profile.name,
        surname: profile.surname || '',
        location: profile.location || '',
        contact_info: profile.contactInfo || '',
        school_level: profile.schoolLevel || '',
        work_experiences: profile.workExperiences,
        references: profile.references,
        face_picture_url: profile.facePictureUrl || '',
        certificate_urls: profile.certificateUrls,
        id_document_urls: profile.idDocumentUrls,
        is_verified: profile.isVerified
      };

      if (balance !== undefined) updateData.balance = balance;
      if (profit !== undefined) updateData.profit = profit;

      await supabase
        .from('profiles')
        .update(updateData)
        .eq('email', profile.email);
    } catch (err) {
      console.error("Supabase update profile error:", err);
    }
  }

  // --- GET OR SEED PAYMENTS ---
  static async getPayments(initialPayments: Payment[]): Promise<Payment[]> {
    if (!supabase) {
      return this.getLocal('payments', initialPayments);
    }

    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          return this.getLocal('payments', initialPayments);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        if (initialPayments.length > 0) {
          const formatted = initialPayments.map(p => ({
            id: p.id,
            user_email: p.user,
            option: p.option,
            price: p.price,
            status: p.status,
            timestamp: p.timestamp,
            proof_url: p.proofUrl || ''
          }));
          await supabase.from('payments').insert(formatted);
        }
        return initialPayments;
      }

      return data.map(item => ({
        id: String(item.id),
        user: item.user_email,
        option: item.option,
        price: item.price,
        status: item.status,
        timestamp: Number(item.timestamp),
        proofUrl: item.proof_url
      }));
    } catch (err) {
      console.error("Supabase payments fetch error:", err);
      return this.getLocal('payments', initialPayments);
    }
  }

  // --- SAVE SINGLE PAYMENT ---
  static async addPayment(p: Payment) {
    if (!supabase) {
      const current = this.getLocal<Payment>('payments', []);
      this.saveLocal('payments', [p, ...current]);
      return;
    }

    try {
      await supabase.from('payments').insert([{
        id: p.id,
        user_email: p.user,
        option: p.option,
        price: p.price,
        status: p.status,
        timestamp: p.timestamp,
        proof_url: p.proofUrl || ''
      }]);
    } catch (err) {
      console.error("Supabase add payment error:", err);
      const current = this.getLocal<Payment>('payments', []);
      this.saveLocal('payments', [p, ...current]);
    }
  }

  // --- UPDATE PAYMENT STATUS ---
  static async updatePaymentStatus(id: string, status: 'approved' | 'rejected') {
    if (!supabase) return;
    try {
      await supabase.from('payments').update({ status }).eq('id', id);
    } catch (err) {
      console.error("Supabase update payment status error:", err);
    }
  }

  // --- GET OR SEED HELPERS ---
  static async getHelpers(initialHelpers: PremiumHelper[]): Promise<PremiumHelper[]> {
    if (!supabase) {
      return this.getLocal('helpers', initialHelpers);
    }

    try {
      const { data, error } = await supabase
        .from('helpers')
        .select('*');

      if (error) {
        if (error.message.includes('does not exist')) {
          return this.getLocal('helpers', initialHelpers);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        // Live state: remove mock helpers or start with empty slate
        return [];
      }

      return data.map(item => ({
        id: String(item.id),
        name: item.name,
        profilePic: item.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        bio: item.bio,
        contact: item.contact,
        role: item.role,
        rating: item.rating || '5.0',
        location: item.location || '',
        completedTasks: Number(item.completed_tasks || 0),
        rate: item.rate || 'R80/hr',
        availableNow: Boolean(item.available_now),
        specialty: item.specialty || '',
        verified: Boolean(item.verified)
      }));
    } catch (err) {
      console.error("Supabase load helpers error:", err);
      return this.getLocal('helpers', initialHelpers);
    }
  }

  static async saveHelper(helper: PremiumHelper) {
    if (!supabase) {
      const current = this.getLocal<PremiumHelper>('helpers', []);
      const filtered = current.filter(h => h.id !== helper.id);
      this.saveLocal('helpers', [helper, ...filtered]);
      return;
    }

    try {
      const payload = {
        id: helper.id,
        name: helper.name,
        profile_pic: helper.profilePic,
        bio: helper.bio,
        contact: helper.contact,
        role: helper.role,
        rating: helper.rating,
        location: helper.location,
        completed_tasks: helper.completedTasks,
        rate: helper.rate,
        available_now: helper.availableNow,
        specialty: helper.specialty,
        verified: helper.verified
      };

      const { error } = await supabase.from('helpers').upsert([payload]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase save helper error:", err);
      const current = this.getLocal<PremiumHelper>('helpers', []);
      const filtered = current.filter(h => h.id !== helper.id);
      this.saveLocal('helpers', [helper, ...filtered]);
    }
  }

  static async deleteHelper(id: string) {
    if (!supabase) {
      const current = this.getLocal<PremiumHelper>('helpers', []);
      this.saveLocal('helpers', current.filter(h => h.id !== id));
      return;
    }
    try {
      await supabase.from('helpers').delete().eq('id', id);
    } catch (err) {
      console.error("Supabase delete helper error:", err);
    }
  }

  // --- GET ALL REGISTERED PROFILES FOR CHAT CONTACTS ---
  static async getAllProfiles(): Promise<UserProfile[]> {
    if (!supabase) {
      return [];
    }
    try {
      const { data, error } = await supabase
          .from('profiles')
          .select('*');
      if (error) {
        if (error.message.includes('does not exist')) return [];
        throw error;
      }
      if (!data) return [];
      return data.map(item => ({
        name: item.name,
        surname: item.surname || '',
        email: item.email,
        location: item.location || '',
        contactInfo: item.contact_info || '',
        schoolLevel: item.school_level || '',
        workExperiences: typeof item.work_experiences === 'string' ? JSON.parse(item.work_experiences) : item.work_experiences || [],
        references: typeof item.references === 'string' ? JSON.parse(item.references) : item.references || [],
        facePictureUrl: item.face_picture_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
        certificateUrls: typeof item.certificate_urls === 'string' ? JSON.parse(item.certificate_urls) : item.certificate_urls || [],
        idDocumentUrls: typeof item.id_document_urls === 'string' ? JSON.parse(item.id_document_urls) : item.id_document_urls || [],
        isVerified: Boolean(item.is_verified)
      }));
    } catch (err) {
      console.error("Supabase getAllProfiles error:", err);
      return [];
    }
  }

  // --- MARKETPLACE ITEMS STORAGE ---
  static async getMarketItems(initialItems: MarketItem[]): Promise<MarketItem[]> {
    if (!supabase) {
      return this.getLocal('market_items', initialItems);
    }
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        if (error.message.includes('does not exist')) {
          return this.getLocal('market_items', initialItems);
        }
        throw error;
      }

      if (!data || data.length === 0) {
        return this.getLocal('market_items', initialItems);
      }

      return data.map(item => ({
        id: String(item.id),
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        status: item.status,
        sellerName: item.seller_name,
        sellerEmail: item.seller_email,
        sellerContact: item.seller_contact,
        location: item.location,
        imageUrl: item.image_url,
        timestamp: Number(item.timestamp),
        views: Number(item.views || 0),
        interestedCount: Number(item.interested_count || 0)
      }));
    } catch (err) {
      console.error("Supabase load market items error:", err);
      return this.getLocal('market_items', initialItems);
    }
  }

  static async saveMarketItem(item: MarketItem) {
    if (!supabase) {
      const current = this.getLocal<MarketItem>('market_items', []);
      const filtered = current.filter(i => i.id !== item.id);
      this.saveLocal('market_items', [item, ...filtered]);
      return;
    }
    try {
      const payload = {
        id: item.id,
        title: item.title,
        description: item.description,
        price: item.price,
        category: item.category,
        status: item.status,
        seller_name: item.sellerName,
        seller_email: item.sellerEmail,
        seller_contact: item.sellerContact,
        location: item.location,
        image_url: item.imageUrl || '',
        timestamp: item.timestamp,
        views: item.views,
        interested_count: item.interestedCount
      };
      const { error } = await supabase.from('market_items').upsert([payload]);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase save market item error:", err);
      const current = this.getLocal<MarketItem>('market_items', []);
      const filtered = current.filter(i => i.id !== item.id);
      this.saveLocal('market_items', [item, ...filtered]);
    }
  }

  static async deleteMarketItem(id: string) {
    if (!supabase) {
      const current = this.getLocal<MarketItem>('market_items', []);
      this.saveLocal('market_items', current.filter(i => i.id !== id));
      return;
    }
    try {
      await supabase.from('market_items').delete().eq('id', id);
    } catch (err) {
      console.error("Supabase delete market item error:", err);
    }
  }
}

export default LiveStorageService;
