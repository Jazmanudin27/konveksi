import { useState, useEffect } from 'react';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Cek apakah sudah berjalan sebagai standalone PWA
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (standaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Tangkap event bawaan Chrome 'beforeinstallprompt'
    const handleBeforeInstallPrompt = (e) => {
      // Cegah mini-infobar default browser agar bisa dikontrol sendiri
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Cek apakah user belum pernah menutup modal install sesi ini
      try {
        const dismissed = sessionStorage.getItem('pwa_install_dismissed');
        if (!dismissed) {
          setShowModal(true);
        }
      } catch (_) {
        setShowModal(true);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const openInstallModal = () => {
    setShowModal(true);
  };

  const closeInstallModal = () => {
    setShowModal(false);
    try {
      sessionStorage.setItem('pwa_install_dismissed', 'true');
    } catch (_) {}
  };

  return {
    deferredPrompt,
    isInstallable,
    isInstalled,
    showModal,
    openInstallModal,
    closeInstallModal,
  };
}