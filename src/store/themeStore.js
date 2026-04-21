// Theme store to manages dark mode state and persistence
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useThemeStore = create((set) => ({
  isDarkMode: false,
  loading: true,

  // Initialize theme from storage
  initialize: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("@app_theme");
      const isDarkMode = savedTheme === "dark";
      set({ isDarkMode, loading: false });
    } catch (error) {
      console.error("Failed to load theme:", error);
      set({ loading: false });
    }
  },

  // Toggle theme and save to storage
  toggleTheme: async () => {
    set((state) => {
      const newIsDarkMode = !state.isDarkMode;
      AsyncStorage.setItem("@app_theme", newIsDarkMode ? "dark" : "light");
      return { isDarkMode: newIsDarkMode };
    });
  },

  // Set theme explicitly
  setTheme: async (isDarkMode) => {
    set({ isDarkMode });
    await AsyncStorage.setItem("@app_theme", isDarkMode ? "dark" : "light");
  },
}));

export default useThemeStore;
