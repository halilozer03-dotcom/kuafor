import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// kuafor-prestige — Firebase konsolundan alındı (2026-08-09). Bu değerler
// istemciye gönderilen genel (publishable) yapılandırmadır, gizli değildir;
// gerçek erişim kontrolü firestore.rules dosyasındadır.
const firebaseConfig = {
  apiKey: 'AIzaSyDSqN_CNwi8-Ra-6EAyjH3qiNkF3XLSqdI',
  authDomain: 'kuafor-prestige.firebaseapp.com',
  projectId: 'kuafor-prestige',
  storageBucket: 'kuafor-prestige.firebasestorage.app',
  messagingSenderId: '578590055738',
  appId: '1:578590055738:web:9aebf526808880e439c403',
};

export const configured = true;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
