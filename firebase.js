
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD_MFyozu3F9Fz0s2MJv8cn456HnOFIo0I",
  authDomain: "the-style-studio-56b3b.firebaseapp.com",
  projectId: "the-style-studio-56b3b",
  storageBucket: "the-style-studio-56b3b.firebasestorage.app",
  messagingSenderId: "1031567794039",
  appId: "1:1031567794039:web:bf25d376405c471ef10b72",
  measurementId: "G-F0EQNKFS0F"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);