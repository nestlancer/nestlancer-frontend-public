'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type SidebarContextValue = {
  isExpanded: boolean;
  isMobileOpen: boolean;
  isHovered: boolean;
  setIsHovered: (hovered: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

const STORAGE_KEY = 'nestlancer.web.sidebar.expanded';

function readExpandedPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsExpanded(readExpandedPreference());
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setIsExpanded(expanded);
    try {
      localStorage.setItem(STORAGE_KEY, String(expanded));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isExpanded,
      isMobileOpen,
      isHovered,
      setIsHovered,
      setExpanded,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
    }),
    [
      isExpanded,
      isMobileOpen,
      isHovered,
      setExpanded,
      toggleSidebar,
      toggleMobileSidebar,
      closeMobileSidebar,
    ]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error('useSidebar must be used within SidebarProvider');
  }
  return ctx;
}
