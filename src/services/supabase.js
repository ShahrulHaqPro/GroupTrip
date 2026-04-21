// Supabase client initialization with AsyncStorage for session persistence.
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl =
  Constants.expoConfig?.extra?.SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase credentials missing. Edit app.json → extra → SUPABASE_URL and SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ─── Auth helpers ────────────────────────────────────────────────────────────

export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // Insert profile row
  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
      name,
    });
  }
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getSession = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
};

// ─── Trips ───────────────────────────────────────────────────────────────────

const generateUuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const createTrip = async (tripData, userId) => {
  if (!userId) {
    throw new Error("You must be signed in to create a trip.");
  }

  // Generate a random 6-character invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const tripId = generateUuid();

  const { error } = await supabase
    .from("trips")
    .insert({
      id: tripId,
      ...tripData,
      created_by: userId,
      invite_code: inviteCode,
    });
  if (error) throw error;

  // Add creator as owner member
  const { error: memberError } = await supabase.from("trip_members").insert({
    trip_id: tripId,
    user_id: userId,
    role: "owner",
  });

  if (memberError) {
    // Roll back the trip so we don't leave an orphaned record behind.
    await supabase.from("trips").delete().eq("id", tripId);
    throw memberError;
  }

  return {
    id: tripId,
    ...tripData,
    created_by: userId,
    invite_code: inviteCode,
  };
};

export const getUserTrips = async (userId) => {
  const { data, error } = await supabase
    .from("trip_members")
    .select("trip_id, role, trips(*)")
    .eq("user_id", userId)
    .order("created_at", { foreignTable: "trips", ascending: false });
  if (error) throw error;
  return data.map((m) => ({ ...m.trips, role: m.role }));
};

export const getTripById = async (tripId) => {
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .eq("id", tripId)
    .single();
  if (error) throw error;
  return data;
};

export const joinTripByCode = async (inviteCode, userId) => {
  const code = inviteCode?.trim()?.toUpperCase();
  if (!code) throw new Error("Invite code is required");

  // Self-heal missing profile rows, otherwise
  // trip_members insert can fail on FK even with a valid invite code.
  if (userId) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authUser?.id === userId && authUser.email) {
        await supabase.from("profiles").upsert({
          id: authUser.id,
          email: authUser.email,
          name:
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            authUser.email.split("@")[0],
        });
      }
    } catch {
      // Non-fatal; continue with join attempt.
    }
  }

  // Preferred path: RPC bypasses trips SELECT RLS for non-members.
  const { data, error } = await supabase.rpc("join_trip_by_invite", {
    p_invite_code: code,
  });

  if (!error) {
    const result = Array.isArray(data) ? data[0] : data;
    const status = result?.status;

    if (status === "JOINED") return { id: result.trip_id };
    if (status === "ALREADY_MEMBER")
      throw new Error("You are already a member of this trip");
    if (status === "INVALID_INVITE_CODE")
      throw new Error("Invalid invite code");
    if (status === "NOT_AUTHENTICATED")
      throw new Error("Please sign in again and retry.");

    throw new Error("Failed to join trip");
  }

  const rawMsg = error.message || "";
  const rpcNotFound =
    error.code === "PGRST202" || /could not find the function/i.test(rawMsg);
  if (rpcNotFound) {
    throw new Error(
      "Join-by-code is not enabled on the server yet. Run migration 002 and retry."
    );
  }

  if (rawMsg.includes("INVALID_INVITE_CODE"))
    throw new Error("Invalid invite code");
  if (rawMsg.includes("ALREADY_MEMBER"))
    throw new Error("You are already a member of this trip");
  if (/not authenticated/i.test(rawMsg))
    throw new Error("Please sign in again and retry.");
  if (
    /foreign key/i.test(rawMsg) &&
    /trip_members_user_id_fkey/i.test(rawMsg)
  ) {
    throw new Error(
      "Your account profile is missing. Please sign out and sign in again, then retry."
    );
  }

  throw error;
};

export const getTripMembers = async (tripId) => {
  const { data, error } = await supabase
    .from("trip_members")
    .select("role, profiles(id, name, email, avatar_url)")
    .eq("trip_id", tripId);
  if (error) throw error;
  return data.map((m) => ({ ...m.profiles, role: m.role }));
};

// ─── Activities ──────────────────────────────────────────────────────────────

export const getActivities = async (tripId) => {
  const { data, error } = await supabase
    .from("activities")
    .select("*, profiles(name), activity_votes(*)")
    .eq("trip_id", tripId)
    .order("datetime", { ascending: true });
  if (error) throw error;
  return data;
};

export const createActivity = async (activityData) => {
  const { data, error } = await supabase
    .from("activities")
    .insert(activityData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateActivity = async (id, updates) => {
  const { data, error } = await supabase
    .from("activities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteActivity = async (id) => {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
};

// ─── Votes ───────────────────────────────────────────────────────────────────

export const upsertVote = async (activityId, userId, voteValue) => {
  const { data, error } = await supabase
    .from("activity_votes")
    .upsert(
      { activity_id: activityId, user_id: userId, vote_value: voteValue },
      { onConflict: "activity_id,user_id" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removeVote = async (activityId, userId) => {
  const { error } = await supabase
    .from("activity_votes")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", userId);
  if (error) throw error;
};

// ─── Expenses ────────────────────────────────────────────────────────────────

export const getExpenses = async (tripId) => {
  const { data, error } = await supabase
    .from("expenses")
    .select("*, profiles(name)")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

export const createExpense = async (expenseData) => {
  const { data, error } = await supabase
    .from("expenses")
    .insert(expenseData)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteExpense = async (id) => {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
};

// ─── Realtime subscriptions ──────────────────────────────────────────────────

export const subscribeToActivities = (tripId, callback) => {
  return supabase
    .channel(`activities:${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "activities",
        filter: `trip_id=eq.${tripId}`,
      },
      callback
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "activity_votes" },
      callback
    )
    .subscribe();
};

export const subscribeToExpenses = (tripId, callback) => {
  return supabase
    .channel(`expenses:${tripId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "expenses",
        filter: `trip_id=eq.${tripId}`,
      },
      callback
    )
    .subscribe();
};
