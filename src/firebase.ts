/**
 * Firebase Stub Module
 * This file provides stub implementations of Firebase hooks that now point to MySQL API routes.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

// Stub types
export interface StubUser {
    uid: string;
    email: string | null;
    photoURL: string | null;
    nama_teknisi?: string;
    role?: string;
    photo?: string;
}

export interface UseUserReturn {
    user: StubUser | null;
    isLoading: boolean;
    refetch: () => Promise<void>;
}

export interface UseDocReturn<T> {
    data: T | null;
    isLoading: boolean;
    error?: any;
}

/**
 * Stub useAuth hook
 */
export function useAuth() {
    return null;
}

/**
 * Hook to get current authenticated user using /api/auth/me
 */
export function useUser(): UseUserReturn {
    const [user, setUser] = useState<StubUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const data = await response.json();
                if (data.user) {
                    setUser({
                        uid: data.user.id.toString(),
                        email: data.user.email,
                        photoURL: data.user.photo || null,
                        ...data.user
                    });
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return { user, isLoading, refetch: fetchUser };
}

/**
 * Stub useFirestore hook
 */
export function useFirestore() {
    return null;
}

/**
 * Stub useFirebaseApp hook
 */
export function useFirebaseApp() {
    return null;
}

/**
 * Stub useDoc hook - repurposed to fetch user data if docRef is null (as used in header/profile)
 */
export function useDoc<T>(docRef: any): UseDocReturn<T> {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // If docRef is null, we assume it's for the current user (based on header.tsx and profile-client.tsx usage)
            const response = await fetch('/api/auth/me');
            if (response.ok) {
                const result = await response.json();
                setData(result.user as T);
            } else {
                setData(null);
            }
        } catch (error) {
            console.error('Error in useDoc stub:', error);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading };
}
