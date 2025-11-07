'use client';

import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore }ve an invalid hook call. Hooks can only be called inside of the body of a function component. This is either because you have a mismatching version of React and the renderer (such as React DOM), or you have more than one copy of React in the same app.
      </p>
      <FirebaseProvider
        firebaseApp={firebaseApp}
        auth={auth}
        firestore={firestore}
      >
        {children}
      </FirebaseProvider>
    </>
  );
}
