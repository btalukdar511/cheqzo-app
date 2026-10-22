"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

interface ShellUi {
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

const ShellUiContext = createContext<ShellUi | null>(null);

export function ShellUiProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(() => ({ commandOpen, setCommandOpen }), [commandOpen]);
  return <ShellUiContext.Provider value={value}>{children}</ShellUiContext.Provider>;
}

export function useShellUi(): ShellUi {
  const value = useContext(ShellUiContext);
  if (!value) throw new Error("Shell UI is only available inside the app shell");
  return value;
}
