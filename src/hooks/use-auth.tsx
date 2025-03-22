import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to check if the user is already authenticated
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check auth status when the component mounts
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return { success: true };
      }
      
      // Handle specific error responses
      if (response.status === 403) {
        return { 
          success: false, 
          message: 'This account requires special authentication. Please use your own account credentials.' 
        };
      } else if (response.status === 401) {
        return { 
          success: false, 
          message: 'Invalid username or password.' 
        };
      }
      
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        message: errorData.message || 'Login failed. Please try again.' 
      };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: 'An error occurred while logging in. Please try again later.' 
      };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}