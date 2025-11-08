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
      await auth.currentUser.reload();
      // After reloading, get the fresh user object and update the state
      const freshUser = auth.currentUser;
      setUser(freshUser ? { ...freshUser } : null);
    } catch (error) {
      console.error("Error refetching user:", error);
      // Potentially sign the user out if reload fails due to token expiry
      setUser(null);
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
