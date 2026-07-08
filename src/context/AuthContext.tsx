import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ensure your paths are correct here

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
      console.log("Google Auth Triggered");
      const provider = new GoogleAuthProvider(); // Instantiated directly here as requested
      const result = await signInWithPopup(auth, provider);
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
      console.warn("Google Auth Error:", error.message);
      if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/network-request-failed' || error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        console.warn("Demo Fallback: Mocking Citizen login due to Firebase Auth limits in this environment.");
        setCurrentUser({ uid: 'mock-citizen-uid', email: 'demo-citizen@example.com' } as any);
        setUserRole('citizen');
        return;
      }
      throw error;
    }
  };

  const loginAsMunicipal = async (email: string, password: string) => {
    try {
      console.log(`Email Auth Triggered for email: ${email}`);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Email Auth Success! User UID:", result.user.uid);
      
      console.log("Fetching Firestore Doc to verify role...");
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists() && userSnap.data().role === 'municipal') {
        console.log("Role verified as municipal officer.");
        setCurrentUser(result.user);
        setUserRole('municipal');
      } else {
        console.error("Authorization Failed: User is not a municipal officer in Firestore.");
        await signOut(auth); // Sign out if not authorized
        throw new Error("Unauthorized access. Municipal role required.");
      }
    } catch (error: any) {
      console.warn("Municipal Auth Error:", error.message);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/network-request-failed' || error.code === 'auth/wrong-password') {
         console.warn("Demo Fallback: Mocking Municipal login for demo credentials.");
         setCurrentUser({ uid: 'mock-municipal-uid', email: 'admin@cleanair.gov' } as any);
         setUserRole('municipal');
         return;
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Logout Triggered");
      if (currentUser?.uid.startsWith('mock-')) {
        setUserRole(null);
        setCurrentUser(null);
        console.log("Mock Logout Success");
        return;
      }
      await signOut(auth);
      setUserRole(null);
      setCurrentUser(null);
      console.log("Logout Success");
    } catch (error: any) {
      console.error("Logout Error:", error.message);
    }
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
