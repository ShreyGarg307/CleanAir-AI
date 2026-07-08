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
  loginAsMunicipal: (email?: string, password?: string) => Promise<void>;
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
    console.log("Direct Citizen Login Activated (Bypass Google Auth)");
    setCurrentUser({
      uid: 'demo-citizen-uid',
      email: 'citizen@cleanair.ai',
      displayName: 'Demo Citizen'
    } as any);
    setUserRole('citizen');
  };

  const loginAsMunicipal = async (email?: string, password?: string) => {
    console.log("Direct Municipal Login Activated (Bypass Credentials)");
    setCurrentUser({
      uid: 'demo-municipal-uid',
      email: 'admin@cleanair.gov',
      displayName: 'Duty Officer'
    } as any);
    setUserRole('municipal');
  };

  const logout = async () => {
    console.log("Logout Triggered");
    setUserRole(null);
    setCurrentUser(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Sign out error:", e);
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
