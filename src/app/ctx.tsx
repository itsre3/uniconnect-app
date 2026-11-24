import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

async function getStorageItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn('SecureStore read error:', e);
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.warn('SecureStore write error:', e);
  }
}

async function deleteStorageItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.warn('SecureStore delete error:', e);
  }
}

interface AuthContextType {
  userToken: string | null;
  userData: any | null;
  isLoading: boolean;
  login: (token: string, user?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (newUserData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  userData: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUserData: async () => {},
});


export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
export default useAuth;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const [token, cachedUser] = await Promise.all([
          getStorageItem('access_token'),
          getStorageItem('user'),
        ]);

        if (token && token.trim() !== '') {
          setUserToken(token);
        } else {
          setUserToken(null);
        }

        if (cachedUser) {
          try {
            setUserData(JSON.parse(cachedUser));
          } catch {
            setUserData(null);
          }
        }
      } catch (error) {
        console.warn('Failed to load credentials from storage:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  const login = useCallback(async (token: string, user?: any) => {
    if (!token) return;
    await setStorageItem('access_token', token);
    setUserToken(token);

    if (user) {
      await setStorageItem('user', JSON.stringify(user));
      setUserData(user);
    }
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      deleteStorageItem('access_token'),
      deleteStorageItem('user'),
    ]);
    setUserToken(null);
    setUserData(null);
  }, []);

  const updateUserData = useCallback(async (newUserData: any) => {
    if (newUserData)
      await setStorageItem('user', JSON.stringify(newUserData));
      setUserData(newUserData);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        login,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}