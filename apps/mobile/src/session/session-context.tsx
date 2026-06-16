import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getSessionToken, clearSessionToken } from '../api/auth-storage';

interface SessionContextValue {
  sessionToken: string | null;
  isReady: boolean;
  setSessionTokenState: (token: string) => void;
  clearSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionToken, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      const token = await getSessionToken();

      if (active) {
        setToken(token);
        setIsReady(true);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const setSessionTokenState = useCallback((token: string) => {
    setToken(token);
  }, []);

  const clearSession = useCallback(async () => {
    await clearSessionToken();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ sessionToken, isReady, setSessionTokenState, clearSession }),
    [sessionToken, isReady, setSessionTokenState, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
}
