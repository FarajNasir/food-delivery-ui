import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setIsReady: (isReady: boolean) => void;
  logout: () => Promise<void>;
  sync: () => Promise<void>;
}

const supabase = createClient();

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isReady: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsReady: (isReady) => set({ isReady }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, isReady: true });
  },
  sync: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, isReady: true });
  }
}));

// Initialize the global listener once at module level
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    console.log(`[useAuthStore] Auth Event: ${event}`);
    const store = useAuthStore.getState();
    
    // Explicitly update session and user
    store.setSession(session);
    store.setUser(session?.user ?? null);
    
    // Once we have a definitive result (or it's null but initial load finished), mark as ready
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        store.setIsReady(true);
    }
  });

  // Explicitly check current session on boot
  supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
    const store = useAuthStore.getState();
    if (session) {
        store.setSession(session);
        store.setUser(session.user);
    }
    store.setIsReady(true);
  }).catch(() => {
    useAuthStore.getState().setIsReady(true);
  });
}
