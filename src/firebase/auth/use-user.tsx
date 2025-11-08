'use client';

import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '../provider';

export const useUser = () => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!auth) return Promise.resolve();
    setIsLoading(true);
    return new Promise<void>((resolve) => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.reload().then(() => {
          setUser({ ...currentUser }); // Create a new object to trigger re-render
          setIsLoading(false);
          resolve();
        });
      } else {
        setUser(null);
        setIsLoading(false);
        resolve();
      }
    });
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

    