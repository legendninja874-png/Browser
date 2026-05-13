import { create } from "zustand";

export type Theme = "dark" | "amoled" | "gray" | "light" | "blue";

export interface BrowserState {
  searchEngine: "google" | "bing" | "duckduckgo" | "brave" | "ecosia" | "yahoo";
  isIncognito: boolean;
  bottomBarButtons: string[];
  bottomBarMode: "chrome" | "compact" | "expanded";
  addressBarPosition: "top" | "bottom";
  isDesktopMode: boolean;
  readerMode: boolean;
  adBlockEnabled: boolean;
  theme: Theme;
  urlInputOpen: boolean;
  pendingUrlInput: string;

  // Local navigation state — drives the iframe immediately without waiting for the DB.
  // This is the source of truth for what is currently loaded in the browser view.
  currentUrl: string;
  currentTitle: string;

  setSearchEngine: (engine: BrowserState["searchEngine"]) => void;
  setIsIncognito: (incognito: boolean) => void;
  setBottomBarButtons: (buttons: string[]) => void;
  setBottomBarMode: (mode: BrowserState["bottomBarMode"]) => void;
  setAddressBarPosition: (pos: BrowserState["addressBarPosition"]) => void;
  setIsDesktopMode: (desktop: boolean) => void;
  setReaderMode: (reader: boolean) => void;
  setAdBlockEnabled: (adBlock: boolean) => void;
  setTheme: (theme: Theme) => void;
  setUrlInputOpen: (open: boolean) => void;
  setPendingUrlInput: (val: string) => void;
  setCurrentUrl: (url: string, title?: string) => void;
}

export const useBrowserStore = create<BrowserState>((set) => ({
  searchEngine: "google",
  isIncognito: false,
  bottomBarButtons: ["back", "forward", "address", "tabs", "menu"],
  bottomBarMode: "chrome",
  addressBarPosition: "bottom",
  isDesktopMode: false,
  readerMode: false,
  adBlockEnabled: true,
  theme: (localStorage.getItem("eon-theme") as Theme) || "dark",
  urlInputOpen: false,
  pendingUrlInput: "",
  currentUrl: "",
  currentTitle: "",

  setSearchEngine: (searchEngine) => set({ searchEngine }),
  setIsIncognito: (isIncognito) => set({ isIncognito }),
  setBottomBarButtons: (bottomBarButtons) => set({ bottomBarButtons }),
  setBottomBarMode: (bottomBarMode) => set({ bottomBarMode }),
  setAddressBarPosition: (addressBarPosition) => set({ addressBarPosition }),
  setIsDesktopMode: (isDesktopMode) => set({ isDesktopMode }),
  setReaderMode: (readerMode) => set({ readerMode }),
  setAdBlockEnabled: (adBlockEnabled) => set({ adBlockEnabled }),
  setUrlInputOpen: (urlInputOpen) => set({ urlInputOpen }),
  setPendingUrlInput: (pendingUrlInput) => set({ pendingUrlInput }),
  setCurrentUrl: (currentUrl, currentTitle) =>
    set({ currentUrl, currentTitle: currentTitle ?? currentUrl }),
  setTheme: (theme) => {
    localStorage.setItem("eon-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    set({ theme });
  },
}));
