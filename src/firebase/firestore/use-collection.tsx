'use client';

import {
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useCollection = <T>(q: Query<DocumentData> | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setData([]);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [q]);

  return { data, isLoading };
};
