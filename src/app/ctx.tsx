import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '@/constants/api';

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
  justLoggedOut: boolean;
  clearJustLoggedOut: () => void;
  login: (token: string, user?: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUserData: (newUserData: any) => Promise<void>;
  refreshUser: (overrideToken?: string) => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType>({
  userToken: null,
  userData: null,
  isLoading: true,
  justLoggedOut: false,
  clearJustLoggedOut: () => {},
  login: async () => {},
  logout: async () => {},
  updateUserData: async () => {},
  refreshUser: async () => null,
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
  const [justLoggedOut, setJustLoggedOut] = useState(false);

  const refreshUser = useCallback(async (overrideToken?: string) => {
    try {
      const token = overrideToken || (await getStorageItem('access_token'));

      if (!token || token.trim() === '') return null;

      // Match this path to your Swagger UI current-user route (e.g. '/auth/me' or '/users/me')
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const freshUser = await response.json();
        await setStorageItem('user', JSON.stringify(freshUser));
        setUserData(freshUser);
        return freshUser;
      }

      if (response.status === 401) {
        await Promise.all([
          deleteStorageItem('access_token'),
          deleteStorageItem('user'),
        ]);
        setUserToken(null);
        setUserData(null);
      }
    } catch (error) {
      // Keep cached userData in SecureStore if offline
      console.warn('Failed to refresh user profile on boot:', error);
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadStoredAuth() {
      try {
        const [token, cachedUser] = await Promise.all([
          getStorageItem('access_token'),
          getStorageItem('user'),
        ]);

        if (!isMounted) return;

        if (cachedUser) {
          try {
            setUserData(JSON.parse(cachedUser));
          } catch {
            setUserData(null);
          }
        }

        if (token && token.trim() !== '') {
          setUserToken(token);
          await refreshUser(token);
        } else {
          setUserToken(null);
        }
      } catch (error) {
        console.warn('Failed to load credentials from storage:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadStoredAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (token: string, user?: any) => {
      if (!token) return;
      setJustLoggedOut(false);
      await setStorageItem('access_token', token);
      setUserToken(token);

      if (user) {
        await setStorageItem('user', JSON.stringify(user));
        setUserData(user);
      } else {
        await refreshUser(token);
      }
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await Promise.all([
      deleteStorageItem('access_token'),
      deleteStorageItem('user'),
    ]);
    setJustLoggedOut(true);
    setUserToken(null);
    setUserData(null);
  }, []);

  const clearJustLoggedOut = useCallback(() => {
    setJustLoggedOut(false);
  }, []);

  const updateUserData = useCallback(async (newUserData: any) => {
    if (newUserData) {
      await setStorageItem('user', JSON.stringify(newUserData));
      setUserData(newUserData);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userToken,
        userData,
        isLoading,
        justLoggedOut,
        clearJustLoggedOut,
        login,
        logout,
        updateUserData,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
