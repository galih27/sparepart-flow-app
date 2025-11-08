
'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '../provider';

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!auth?.currentUser) {
      setUser(null);
      return;
    }
    
    setIsLoading(true);
    try {
      // Force a token refresh and get the latest user data from Firebase Auth
      await auth.currentUser.reload();
      // After reloading, get the fresh user object which includes the latest profile
      const freshUser = auth.currentUser;
      // Update the state with a new object to ensure React detects the change
      setUser(freshUser ? { ...freshUser } : null);
    } catch (error) {
      console.error("Error refetching user:", error);
      // Potentially sign the user out if reload fails due to token expiry
      if (error.code === 'auth/user-token-expired') {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [auth]);


  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, isLoading, refetch };
};

    