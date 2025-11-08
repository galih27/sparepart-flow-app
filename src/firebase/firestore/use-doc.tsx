'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentData,
  getDoc,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';

export const useDoc = <T>(ref: DocumentReference<DocumentData> | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!ref) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const docSnap = await getDoc(ref);
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() } as T);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    fetchData(); // Initial fetch

    if (!ref) {
      return;
    }
    
    const unsubscribe = onSnapshot(ref, (doc) => {
      if (doc.exists()) {
        setData({ id: doc.id, ...doc.data() } as T);
      } else {
        setData(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error in snapshot listener:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ref, fetchData]);

  return { data, isLoading, refetch: fetchData };
};

    