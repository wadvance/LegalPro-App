import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { canInstall, tryInstall } from '../services/installApp';

const InstallContext = createContext();

export function InstallProvider({ children }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (!canInstall()) return;

    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = useCallback(async () => {
    setShowBanner(false);
    try {
      const installed = await tryInstall();
      if (!installed) {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    }
  }, []);

  const handleBannerInstall = useCallback(async () => {
    setShowBanner(false);
    try {
      const installed = await tryInstall();
      if (!installed) {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    }
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <InstallContext.Provider
      value={{
        onInstall: handleInstall,
        showBanner,
        dismissBanner,
        onBannerInstall: handleBannerInstall,
        showModal,
        closeModal,
      }}
    >
      {children}
    </InstallContext.Provider>
  );
}

export function useInstall() {
  return useContext(InstallContext);
}

export default InstallContext;
