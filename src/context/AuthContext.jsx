import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut as fbSignOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

const AuthContext = createContext(null);

// KALIP NOTU: Supabase sürümünde "salon_admins boşsa ilk giriş yapan otomatik
// yönetici olur" kuralı vardı — kolay ilk kurulum için. Ama bu, site yayına
// alındığında adresi bulan HERKESİN salonu ele geçirebileceği anlamına
// geliyordu. Firestore sürümünde bilerek KALDIRILDI: yönetici olmak için
// admins/{uid} belgesi Firebase konsolundan (veya Admin SDK'dan) elle
// eklenmeli. Hesap oluşturmak artık otomatik yetki VERMEZ, yalnızca oturum açar.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(function () {
    let active = true;

    async function refreshAdminStatus(u) {
      if (!u) {
        setIsAdmin(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'admins', u.uid));
        if (active) setIsAdmin(snap.exists());
      } catch (e) {
        if (active) setIsAdmin(false);
      }
    }

    const unsub = onAuthStateChanged(auth, function (u) {
      setUser(u);
      refreshAdminStatus(u).finally(function () {
        if (active) setLoading(false);
      });
    });

    return function () {
      active = false;
      unsub();
    };
  }, []);

  async function signIn(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email, password) {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut() {
    await fbSignOut(auth);
  }

  // session adı Supabase'den kalma; App.jsx bunu "oturum var mı" için
  // kullanıyor, Firebase User nesnesiyle aynı işi görüyor.
  const value = { session: user, isAdmin, loading, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
