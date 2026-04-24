import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { authApi, AuthUser, UserRole } from '@/lib/api';

interface AuthState {
  session:  Session  | null;
  user:     User     | null;   // Supabase auth user — use for .id
  profile:  AuthUser | null;   // DB profile — use for name, email, role display
  role:     UserRole | null;   // kept for fast role checks across the app
  isReady:  boolean;

  setSession: (session: Session | null) => void;
  setUser:    (user: User | null)       => void;
  setProfile: (profile: AuthUser | null) => void;
  setRole:    (role: UserRole | null)   => void;
  setIsReady: (ready: boolean)          => void;
  logout:     () => Promise<void>;
}

const supabase = createClient();

export const useAuthStore = create<AuthState>((set) => ({
  session:  null,
  user:     null,
  profile:  null,
  role:     null,
  isReady:  false,

  setSession: (session) => set({ session }),
  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setRole:    (role)    => set({ role }),
  setIsReady: (isReady) => set({ isReady }),

  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, role: null, isReady: true });
  },
}));

// ── Load profile for a given session ──────────────────────────────────────────
// Fetches the DB profile and sets role + profile atomically,
// then marks the store as ready. Used on INITIAL_SESSION and SIGNED_IN.
async function loadProfile(session: Session) {
  const store = useAuthStore.getState();
  store.setSession(session);
  store.setUser(session.user);

  try {
    const res = await authApi.getMe();
    if (res.success && res.data) {
      store.setProfile(res.data);
      store.setRole(res.data.role);
    } else {
      store.setProfile(null);
      store.setRole(null);
    }
  } catch {
    store.setProfile(null);
    store.setRole(null);
  } finally {
    // isReady only becomes true AFTER profile is resolved —
    // prevents CartContext / OrderContext from firing with a null role.
    store.setIsReady(true);
  }
}

// ── Global auth state listener ─────────────────────────────────────────────────
// We rely solely on onAuthStateChange — no parallel getSession() call.
// INITIAL_SESSION fires after Supabase has verified + refreshed the token,
// so we never set isReady before we have a trustworthy session.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    const store = useAuthStore.getState();

    switch (event) {
      case 'INITIAL_SESSION':
      case 'SIGNED_IN':
        if (session) {
          // Load profile then mark ready — async, but isReady stays false until done.
          loadProfile(session);
        } else {
          // No session (e.g. guest on INITIAL_SESSION) — mark ready immediately.
          store.setIsReady(true);
        }
        break;

      case 'TOKEN_REFRESHED':
        // Only the token changed — profile/role haven't changed.
        // Update session silently without touching isReady.
        store.setSession(session);
        store.setUser(session?.user ?? null);
        break;

      case 'SIGNED_OUT':
        store.setSession(null);
        store.setUser(null);
        store.setProfile(null);
        store.setRole(null);
        store.setIsReady(true);
        break;

      case 'USER_UPDATED':
        // Re-fetch profile since user data may have changed.
        if (session) loadProfile(session);
        break;
    }
  });
}
