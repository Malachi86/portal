'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, Firestore, onSnapshot, DocumentReference, Query } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Production configuration for the public Firebase Client SDK initialization
const firebaseConfig = {
  apiKey: "mock-api-key-nexus-lms",
  authDomain: "nexus-lms-prototype.firebaseapp.com",
  projectId: "nexus-lms-prototype",
  storageBucket: "nexus-lms-prototype.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:mockappid123456"
};

export function initializeFirebase() {
  const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return { firebaseApp, firestore, auth };
}

const FirebaseAppContext = createContext<FirebaseApp | null>(null);
const FirestoreContext = createContext<Firestore | null>(null);
const AuthContext = createContext<Auth | null>(null);

export function FirebaseClientProvider({
  children,
  firebaseApp,
  firestore,
  auth
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}) {
  return (
    <FirebaseAppContext.Provider value={firebaseApp}>
      <FirestoreContext.Provider value={firestore}>
        <AuthContext.Provider value={auth}>
          {children}
        </AuthContext.Provider>
      </FirestoreContext.Provider>
    </FirebaseAppContext.Provider>
  );
}

export function useFirebaseApp() {
  return useContext(FirebaseAppContext);
}

export function useFirestore() {
  return useContext(FirestoreContext);
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    setUser(auth.currentUser);
    setLoading(false);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  return { user, loading };
}

export function useCollection(query: Query | null) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(query, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setData(items);
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return unsubscribe;
  }, [query]);

  return { data, loading };
}

export function useDoc(docRef: DocumentReference | null) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setData(null);
      }
      setLoading(false);
    }, (error) => {
      setLoading(false);
    });
    return unsubscribe;
  }, [docRef]);

  return { data, loading };
}
