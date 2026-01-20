import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthChange, 
  loginUser, 
  registerUser, 
  logoutUser, 
  getUserData,
  syncProgress 
} from '../services/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, requireAuth = false }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const result = await getUserData(firebaseUser.uid);
        if (result.success) {
          setUserData(result.data);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username, password) => {
    setError(null);
    const result = await loginUser(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    return result;
  };

  const register = async (username, password, email = null) => {
    setError(null);
    const result = await registerUser(username, password, email);
    
    if (!result.success) {
      setError(result.error);
    }
    
    return result;
  };

  const logout = async () => {
    setError(null);
    const result = await logoutUser();
    
    if (!result.success) {
      setError(result.error);
    }
    
    return result;
  };

  const syncLocalProgress = async (localStats, certId = null) => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    const result = await syncProgress(user.uid, localStats, certId);
    
    if (result.success) {
      setUserData(prev => ({ ...prev, stats: result.stats }));
    }
    
    return result;
  };

  const refreshUserData = async () => {
    if (!user) return;
    const result = await getUserData(user.uid);
    if (result.success) {
      setUserData(result.data);
    }
  };

  const value = {
    user,
    userData,
    loading,
    error,
    authChecked,
    isAuthenticated: !!user,
    requireAuth,
    login,
    register,
    logout,
    syncLocalProgress,
    refreshUserData,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
