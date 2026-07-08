import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyABm4VRQf1KdML0iVZwalZAx0K0aLgzNZE",
  authDomain: "auth-44d9c.firebaseapp.com",
  projectId: "auth-44d9c",
  storageBucket: "auth-44d9c.firebasestorage.app",
  messagingSenderId: "963013554809",
  appId: "1:963013554809:web:ffdb8532f50c032fbb1aa8",
  measurementId: "G-JQ3FXJJ40B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
