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
}

const supabase = createClient();

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isReady: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setIsReady: (isReady) => set({ isReady }),
}));

// Initialize the global listener once at module level
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    const store = useAuthStore.getState();
    store.setSession(session);
    store.setUser(session?.user ?? null);
    
    // Once we have a definitive result (or it's null but initial load finished), mark as ready
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
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
  });
}
