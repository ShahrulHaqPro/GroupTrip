import { create } from "zustand";
import {
  getUserTrips,
  createTrip,
  getTripById,
  joinTripByCode,
  getTripMembers,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  upsertVote,
  removeVote,
  getExpenses,
  createExpense,
  deleteExpense,
} from "../services/supabase";
import {
  cacheData,
  getCachedData,
  enqueueOperation,
} from "../utils/offlineSync";

const useTripStore = create((set, get) => ({
  trips: [],
  currentTrip: null,
  members: [],
  activities: [],
  expenses: [],
  loading: false,
  activitiesLoading: false,
  expensesLoading: false,
  error: null,

  // ─── Trips ──────────────────────────────────────────────────────────────────

  fetchTrips: async (userId) => {
    set({ loading: true, error: null });
    try {
      const trips = await getUserTrips(userId);
      set({ trips, loading: false });
      await cacheData(`trips:${userId}`, trips);
    } catch (e) {
      // Try cache
      const cached = await getCachedData(`trips:${userId}`);
      set({ trips: cached || [], loading: false, error: e.message });
    }
  },

  addTrip: async (tripData, userId) => {
    const trip = await createTrip(tripData, userId);
    set((state) => ({ trips: [trip, ...state.trips] }));
    return trip;
  },

  setCurrentTrip: async (tripId) => {
    try {
      const trip = await getTripById(tripId);
      set({ currentTrip: trip });
      return trip;
    } catch (e) {
      set({ error: e.message });
    }
  },

  joinTrip: async (inviteCode, userId) => {
    const trip = await joinTripByCode(inviteCode, userId);
    await get().fetchTrips(userId);
    return trip;
  },

  // ─── Members ────────────────────────────────────────────────────────────────

  fetchMembers: async (tripId) => {
    try {
      const members = await getTripMembers(tripId);
      set({ members });
      return members;
    } catch (e) {
      set({ error: e.message });
    }
  },

  // ─── Activities ─────────────────────────────────────────────────────────────

  fetchActivities: async (tripId) => {
    set({ activitiesLoading: true });
    try {
      const activities = await getActivities(tripId);
      set({ activities, activitiesLoading: false });
      await cacheData(`activities:${tripId}`, activities);
    } catch (e) {
      const cached = await getCachedData(`activities:${tripId}`);
      set({ activities: cached || [], activitiesLoading: false });
    }
  },

  addActivity: async (activityData, isOffline = false) => {
    if (isOffline) {
      // Store locally with temp id
      const tempActivity = {
        ...activityData,
        id: `temp_${Date.now()}`,
        isDraft: true,
      };
      set((state) => ({ activities: [...state.activities, tempActivity] }));
      await enqueueOperation({
        type: "CREATE_ACTIVITY",
        payload: activityData,
      });
      return tempActivity;
    }
    const activity = await createActivity(activityData);
    set((state) => ({ activities: [...state.activities, activity] }));
    return activity;
  },

  editActivity: async (id, updates) => {
    const activity = await updateActivity(id, updates);
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === id ? { ...a, ...activity } : a
      ),
    }));
    return activity;
  },

  removeActivity: async (id) => {
    await deleteActivity(id);
    set((state) => ({
      activities: state.activities.filter((a) => a.id !== id),
    }));
  },

  // Called by realtime subscription
  refreshActivities: async (tripId) => {
    const activities = await getActivities(tripId);
    set({ activities });
  },

  // ─── Votes ──────────────────────────────────────────────────────────────────

  castVote: async (activityId, userId, voteValue) => {
    await upsertVote(activityId, userId, voteValue);
    // Refresh activities to get updated vote counts
    const { currentTrip } = get();
    if (currentTrip) await get().fetchActivities(currentTrip.id);
  },

  deleteVote: async (activityId, userId) => {
    await removeVote(activityId, userId);
    const { currentTrip } = get();
    if (currentTrip) await get().fetchActivities(currentTrip.id);
  },

  // ─── Expenses ───────────────────────────────────────────────────────────────

  fetchExpenses: async (tripId) => {
    set({ expensesLoading: true });
    try {
      const expenses = await getExpenses(tripId);
      set({ expenses, expensesLoading: false });
      await cacheData(`expenses:${tripId}`, expenses);
    } catch (e) {
      const cached = await getCachedData(`expenses:${tripId}`);
      set({ expenses: cached || [], expensesLoading: false });
    }
  },

  addExpense: async (expenseData) => {
    const expense = await createExpense(expenseData);
    set((state) => ({ expenses: [expense, ...state.expenses] }));
    return expense;
  },

  removeExpense: async (id) => {
    await deleteExpense(id);
    set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
  },

  // ─── Expense balance computation ──────────────────────────────────────────

  computeBalances: () => {
    const { expenses, members } = get();
    const balances = {}; // userId → net amount (+owed, -owes)

    members.forEach((m) => {
      balances[m.id] = 0;
    });

    expenses.forEach((exp) => {
      const { amount, paid_by, split_among } = exp;
      if (!split_among || split_among.length === 0) return;

      const perPerson = amount / split_among.length;
      // Payer gets credit
      balances[paid_by] = (balances[paid_by] || 0) + amount;
      // Each member owes their share
      split_among.forEach((uid) => {
        balances[uid] = (balances[uid] || 0) - perPerson;
      });
    });

    return balances;
  },

  clearCurrentTrip: () =>
    set({ currentTrip: null, members: [], activities: [], expenses: [] }),
  clearError: () => set({ error: null }),
}));

export default useTripStore;
