'use client';

import { ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, auth, firestore } = initializeFirebase();

  if (!firebaseApp || !auth || !firestore) {
    // Anda bisa menampilkan loading indicator di sini jika perlu
    return <p>Connecting to Firebase...</p>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
