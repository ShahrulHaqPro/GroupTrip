import { create } from "zustand";
import { supabase, signIn, signUp, signOut } from "../services/supabase";

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  // ─── Initialise from existing session ───────────────────────────────────────
  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, session, profile, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }

    // Listen to auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, session, profile });
      } else {
        set({ user: null, session: null, profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await signIn(email, password);
      const profile = await get().fetchProfile(data.user.id);
      set({ user: data.user, session: data.session, profile, loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true, error: null });
    try {
      const data = await signUp(email, password, name);
      set({ loading: false });
      return data;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, session: null, profile: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
