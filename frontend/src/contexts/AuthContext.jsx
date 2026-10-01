import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'uiux_analyzer_user_profile';

function generateUserId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `user_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `user_${Math.random().toString(36).substring(2, 10)}`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}

    // Generate clean guest user session
    const guestId = generateUserId();
    return {
      id: guestId,
      name: 'Guest Designer',
      email: '',
      isGuest: true,
      workspace: 'Personal Workspace',
      createdAt: new Date().toISOString(),
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (_) {}
  }, [user]);

  const updateProfile = (updates) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
      isGuest: updates.email ? false : prev.isGuest,
    }));
  };

  const loginUser = (email, name) => {
    const cleanId = `usr_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    setUser({
      id: cleanId,
      name: name || email.split('@')[0],
      email: email,
      isGuest: false,
      workspace: `${name || email.split('@')[0]}'s Workspace`,
      createdAt: new Date().toISOString(),
    });
  };

  const logoutToNewGuest = () => {
    const guestId = generateUserId();
    const guestUser = {
      id: guestId,
      name: 'Guest Designer',
      email: '',
      isGuest: true,
      workspace: 'Personal Workspace',
      createdAt: new Date().toISOString(),
    };
    setUser(guestUser);
  };

  return (
    <AuthContext.Provider value={{ user, updateProfile, loginUser, logoutToNewGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
