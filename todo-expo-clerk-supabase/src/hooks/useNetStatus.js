// Custom hook to monitor network status
// src/hooks/useNetStatus.js
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export default function useNetStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(Boolean(state.isConnected && state.isInternetReachable));
    });
    return () => unsubscribe();
  }, []);

  return isConnected;
}
