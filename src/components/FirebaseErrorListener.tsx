'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This component listens for Firestore permission errors emitted via the
// centralized errorEmitter and displays them to the user using a toast notification.
// In a development environment, it also throws the error to leverage
// Next.js's detailed error overlay for easier debugging.
export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to permission errors.
    const unsubscribe = errorEmitter.on('permission-error', (error: FirestorePermissionError) => {
      
      // In a production environment, you might want to log this to a service
      // like Sentry, and show a user-friendly toast notification.
      if (process.env.NODE_ENV === 'production') {
        // Example: logErrorToService(error);
        toast({
          variant: 'destructive',
          title: 'Akses Ditolak',
          description: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
        });
      } else {
        // In development, we throw the error.
        // This will be caught by Next.js's error overlay,
        // providing a rich, interactive debugging experience.
        // The detailed context in FirestorePermissionError is crucial here.
        throw error;
      }
    });

    // Clean up the subscription when the component unmounts.
    return () => unsubscribe();
  }, [toast]);

  // This component does not render anything to the DOM.
  return null;
}
