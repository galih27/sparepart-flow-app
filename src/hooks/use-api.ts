"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { InventoryItem, User } from '@/lib/definitions';

/**
 * Hook untuk fetch data dari Supabase dengan auto-refetch
 */
export function useAPIFetch<T>(endpoint: string | null) {
    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetch = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!endpoint) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await handleSupabaseRequest('GET', endpoint);
                if (result.error) throw result.error;

                const resData = result.data;
                if (Array.isArray(resData)) {
                    setData(resData as T[]);
                } else if (resData && typeof resData === 'object' && 'data' in resData && Array.isArray(resData.data)) {
                    setData(resData.data as T[]);
                } else {
                    setData(Array.isArray(resData) ? resData : []);
                }

                setError(null);
            } catch (err: any) {
                console.error("Supabase Fetch Error:", err);
                setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [endpoint, refreshTrigger]);

    return { data, isLoading, error, refetch };
}

/**
 * Hook untuk fetch single document/data dari Supabase
 */
export function useAPIDoc<T>(endpoint: string | null) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetch = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        if (!endpoint) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const result = await handleSupabaseRequest('GET', endpoint);
                if (result.error) throw result.error;
                setData(result.data as T);
                setError(null);
            } catch (err: any) {
                setError(err instanceof Error ? err : new Error(err.message || 'Unknown error'));
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [endpoint, refreshTrigger]);

    return { data, isLoading, error, refetch };
}

/**
 * Hook untuk mendapatkan user yang sedang login via Supabase Auth
 */
export function useCurrentUser() {
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refetch = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            setIsLoading(true);
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', session.user.email)
                        .single();

                    const userData = profile || {
                        id: session.user.id,
                        email: session.user.email,
                        ...session.user.user_metadata
                    };
                    setUser(userData);
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error('Auth check error:', err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) refetch();
            else setUser(null);
        });

        return () => subscription.unsubscribe();

    }, [refreshTrigger]);

    return { user, isLoading, refetch };
}

/**
 * Helper function which maps API endpoints to Supabase logic (Client Side)
 */
async function handleSupabaseRequest(method: string, url: string, body?: any): Promise<{ data: any; error: any }> {
    try {
        const urlObj = new URL(url, 'http://dummy.com');
        const pathname = urlObj.pathname;

        // Auth Routes
        if (pathname === '/api/auth/login') {
            const { email, password } = body;
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            return { data: data.user, error: null };
        }

        if (pathname === '/api/auth/logout') {
            const { error } = await supabase.auth.signOut();
            return { data: { success: true }, error };
        }

        if (pathname === '/api/users/photo') {
            const { photo } = body;
            const imageUrl = await uploadToCloudinary(photo, 'user_photos');

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: dbError } = await supabase
                .from('users')
                .update({ photo: imageUrl })
                .eq('email', user.email);

            if (dbError) {
                await supabase.auth.updateUser({ data: { photo: imageUrl } });
            }

            return { data: { success: true, url: imageUrl }, error: null };
        }

        if (pathname === '/api/users/change-password') {
            const { newPassword } = body;
            const { data, error } = await supabase.auth.updateUser({ password: newPassword });
            return { data, error };
        }

        // Inventory Routes
        if (pathname === '/api/inventory') {
            if (method === 'GET') {
                const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
                return { data, error };
            }
            if (method === 'POST') {
                // Handle bulk or single insert
                const payload = Array.isArray(body) ? body : [body];
                // Remove 'id' if it's empty string/undefined to let DB generate it? 
                // Supabase handles UUID or numeric ID generation.
                const { data, error } = await supabase.from('inventory').insert(payload).select();
                return { data, error };
            }
            if (method === 'DELETE') {
                const { error } = await supabase.from('inventory').delete().neq('id', '0');
                return { data: { success: true }, error };
            }
        }

        const inventoryMatch = pathname.match(/^\/api\/inventory\/(.+)$/);
        if (inventoryMatch) {
            const id = inventoryMatch[1];

            if (method === 'PUT') {
                const { data, error } = await supabase.from('inventory').update(body).eq('id', id).select();
                return { data, error };
            }
            if (method === 'DELETE') {
                const { error } = await supabase.from('inventory').delete().eq('id', id);
                return { data: { success: true }, error };
            }
            if (method === 'GET') {
                const { data, error } = await supabase.from('inventory').select('*').eq('id', id).single();
                return { data, error };
            }
        }

        throw new Error(`Endpoint ${pathname} not implemented for Supabase migration.`);

    } catch (err: any) {
        console.error(`Error in Supabase Request [${method} ${url}]:`, err);
        return { data: null, error: err };
    }
}

export const api = {
    get: async <T = any>(url: string) => {
        return handleSupabaseRequest('GET', url);
    },

    post: async <T = any>(url: string, body: any) => {
        return handleSupabaseRequest('POST', url, body);
    },

    put: async <T = any>(url: string, body: any) => {
        return handleSupabaseRequest('PUT', url, body);
    },

    delete: async <T = any>(url: string) => {
        return handleSupabaseRequest('DELETE', url);
    },
};
