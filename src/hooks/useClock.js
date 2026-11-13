import { useState, useEffect } from 'react';

/**
 * Custom hook untuk update jam dan tanggal real-time
 */
export function useClock() {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      const datePart = now.toLocaleDateString('id-ID', options);
      const timePart = now.toLocaleTimeString('id-ID', { hour12: false });
      setTimeString(`${datePart} • ${timePart}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return timeString;
}

