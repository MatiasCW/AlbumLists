import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to sync email verification status with Firestore
  const syncEmailVerification = async (user) => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Update Firestore if email verification status changed
        if (userData.emailVerified !== user.emailVerified) {
          await updateDoc(doc(db, 'users', user.uid), {
            emailVerified: user.emailVerified
          });
        }
        
        setUserData({
          ...userData,
          emailVerified: user.emailVerified
        });
      }
    }
  };

  useEffect(() => {
    let unsubscribeUserData = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Sync email verification status
        await syncEmailVerification(user);
        
        // Set up real-time listener for user data
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUserData = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // User document doesn't exist yet (new user)
            setUserData(null);
          }
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
        if (unsubscribeUserData) {
          unsubscribeUserData();
        }
      }
    });

    return () => {
      if (unsubscribeUserData) {
        unsubscribeUserData();
      }
      unsubscribeAuth();
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resendVerification = async () => {
    if (user) {
      try {
        await sendEmailVerification(user);
        return true;
      } catch (error) {
        console.error('Error resending verification:', error);
        throw error;
      }
    }
    return false;
  };

  const value = {
    user,
    userData,
    logout,
    loading,
    resendVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};