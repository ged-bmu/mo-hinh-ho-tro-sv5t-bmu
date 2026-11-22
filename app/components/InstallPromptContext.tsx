
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

type InstallContextType = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
  showIOSGuide: boolean;
  setShowIOSGuide: (show: boolean) => void;
  clearPrompt: () => void;
  markInstalled: () => void;
};

const InstallContext = createContext<InstallContextType>({
  deferredPrompt: null,
  installed: false,
  showIOSGuide: false,
  setShowIOSGuide: () => {},
  clearPrompt: () => {},
  markInstalled: () => {},
});
export function useInstallPrompt() {
  return useContext(InstallContext);
}

export default function InstallPromptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    ) {
      setInstalled(true);
    }

    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      console.log("ĐÃ NHẬN beforeinstallprompt:", e);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      beforeInstallHandler
    );

    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        beforeInstallHandler
      );

      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const clearPrompt = () => {
    setDeferredPrompt(null);
  };

  const markInstalled = () => {
    setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <InstallContext.Provider
  value={{
    deferredPrompt,
    installed,
    showIOSGuide,
    setShowIOSGuide,
    clearPrompt,
    markInstalled,
  }}
>
      {children}
    </InstallContext.Provider>
  );
}
