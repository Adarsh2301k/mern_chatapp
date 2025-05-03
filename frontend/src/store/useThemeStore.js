import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme:localStorage.getItem("chat-theme") || "light", // default theme is light
  setTheme: (theme) => { 
    localStorage.setItem("chat-theme",theme) // save theme to local storage
    set({theme})// set the theme in state
}, 
}));