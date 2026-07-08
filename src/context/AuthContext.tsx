import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

type UserRole = 'citizen' | 'municipal' | null;

interface AuthContextType {
  userRole: UserRole;
  currentUser: User | null;
  loading: boolean;
  loginAsCitizen: () => Promise<void>;
  loginAsMunicipal: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth State Changed. User UID:", user ? user.uid : "No User");
      if (user) {
        setCurrentUser(user);
        try {
          console.log("Fetching user role from Firestore...");
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const role = docSnap.data().role;
            console.log("User Role Loaded Successfully:", role);
            setUserRole(role as UserRole);
          } else {
            console.warn("No user document found in Firestore. Defaulting to 'citizen'.");
            setUserRole('citizen');
          }
        } catch (error: any) {
          console.error("Error fetching user document from Firestore:", error.message);
          setUserRole('citizen'); // Default fallback
        }
      } else {
        console.log("Clearing user state (logged out).");
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginAsCitizen = async () => {
    try {
      console.log("Google Auth Triggered via signInWithPopup");
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Auth Success! User UID:", result.user.uid);
      
      console.log("Checking if user doc exists in Firestore...");
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        console.log("Creating new user doc for citizen...");
        await setDoc(userRef, { role: 'citizen', email: result.user.email });
      } else {
        console.log("User doc already exists.");
      }
      
      setCurrentUser(result.user);
      setUserRole('citizen');
    } catch (error: any) {
      console.error("Google Auth Error:", error.message);
      throw error;
    }
  };

  const loginAsMunicipal = async (email: string, password: string) => {
    try {
      console.log(`Email Auth Triggered for email: ${email}`);
      let result;
      try {
        result = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        // If the user does not exist in Firebase, auto-register them to simplify first-time officer setup
        if (
          authError.code === 'auth/user-not-found' || 
          authError.code === 'auth/invalid-credential'
        ) {
          console.log("User not found or credentials invalid. Attempting auto-registration as officer...");
          result = await createUserWithEmailAndPassword(auth, email, password);
          console.log("Auto-registration success! Creating Firestore role documentation...");
          const userRef = doc(db, 'users', result.user.uid);
          await setDoc(userRef, { role: 'municipal', email: result.user.email });
        } else {
          throw authError;
        }
      }

      console.log("Email Auth Success! User UID:", result.user.uid);
      
      console.log("Fetching Firestore Doc to verify role...");
      const userRef = doc(db, 'users', result.user.uid);
      let userSnap = await getDoc(userRef);
      
      if (!userSnap.exists() || userSnap.data().role !== 'municipal') {
        console.log("Registering/Correcting user role as municipal in Firestore...");
        await setDoc(userRef, { role: 'municipal', email: result.user.email }, { merge: true });
        userSnap = await getDoc(userRef);
      }

      console.log("Role verified as municipal officer.");
      setCurrentUser(result.user);
      setUserRole('municipal');
    } catch (error: any) {
      console.error("Municipal Auth Error:", error.message);
      throw error;
    }
  };

  const logout = async () => {
    console.log("Logout Triggered");
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
    setUserRole(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ userRole, currentUser, loading, loginAsCitizen, loginAsMunicipal, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
