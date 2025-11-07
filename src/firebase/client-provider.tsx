
'use client';

import { ReactNode } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';

// This component now immediately initializes Firebase and provides it to its children.
// It no longer shows a loading message, as initialization is synchronous.
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const { firebaseApp, auth, firestore } = initializeFirebase();

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
