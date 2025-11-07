'use client';

import {
  onSnapshot,
  DocumentReference,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useDoc = <T>(ref: DocumentReference<DocumentData> | null) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(ref, (doc) => {
      if (doc.exists()) {
        setData({ id: doc.id, ...doc.data() } as T);
      } else {
        setData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [ref]);

  return { data, isLoading };
};
