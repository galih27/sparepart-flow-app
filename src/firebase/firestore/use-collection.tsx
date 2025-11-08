'use client';

import {
  onSnapshot,
  Query,
  DocumentData,
  getDocs,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '../errors';

export const useCollection = <T>(q: Query<DocumentData> | null) => {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!q) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
        const querySnapshot = await getDocs(q);
        const data: T[] = [];
        querySnapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(data);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
          path: (q as any)._path?.toString(),
          operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setData([]);
    } finally {
        setIsLoading(false);
    }
  }, [q]);


  useEffect(() => {
    if (!q) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: T[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(data);
      setIsLoading(false);
    }, async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: (q as any)._path?.toString(),
          operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [q]);

  const refetch = useCallback(() => {
      setIsLoading(true);
      return fetchData();
  }, [fetchData]);

  return { data, isLoading, refetch };
};
