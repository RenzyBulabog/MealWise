import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { FEATURED_SEED } from '../data/featured';
import { bus } from '../events';
import type { Account, Announcement, GlobalData, Meal, Role, UserData } from '../types';
import { isEmail, passwordProblem } from '../utils/validate';

const K_ACCOUNTS = '@mealwise/accounts';
const K_SESSION = '@mealwise/session';
const K_GLOBAL = '@mealwise/global';
const userKey = (id: string) => `@mealwise/user/${id}`;

/** First admin account, created automatically the first time the app opens. */
export const DEFAULT_ADMIN = { name: 'MealWise Admin', email: 'admin@mealwise.app', password: 'Admin123!' };

const hashPassword = (salt: string, password: string) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

export interface Stats {
  users: number;
  admins: number;
  disabled: number;
  planned: number;
  cooked: number;
  custom: number;
  favorites: number;
  featured: number;
  top: { name: string; count: number }[];
}

interface AuthApi {
  ready: boolean;
  account: Account | null;
  accounts: Account[];
  global: GlobalData;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string | null>;
  // admin
  setDisabled: (id: string, disabled: boolean) => Promise<void>;
  setRole: (id: string, role: Role) => Promise<void>;
  resetPassword: (id: string) => Promise<string>;
  deleteUser: (id: string) => Promise<void>;
  saveFeatured: (meal: Meal) => Promise<void>;
  deleteFeatured: (id: string) => Promise<void>;
  setAnnouncement: (text: string | null) => Promise<void>;
  loadStats: () => Promise<Stats>;
}

const Ctx = createContext<AuthApi | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [global, setGlobal] = useState<GlobalData>({ featured: [], announcement: null });
  const accountsRef = useRef<Account[]>([]);
  const globalRef = useRef<GlobalData>(global);

  const saveAccounts = useCallback(async (next: Account[]) => {
    accountsRef.current = next;
    setAccounts(next);
    await AsyncStorage.setItem(K_ACCOUNTS, JSON.stringify(next));
  }, []);

  const saveGlobal = useCallback(async (next: GlobalData) => {
    globalRef.current = next;
    setGlobal(next);
    await AsyncStorage.setItem(K_GLOBAL, JSON.stringify(next));
  }, []);

  const saveSession = useCallback(async (id: string | null) => {
    setSessionId(id);
    if (id) await AsyncStorage.setItem(K_SESSION, id);
    else await AsyncStorage.removeItem(K_SESSION);
  }, []);

  // Load everything once when the app starts.
  useEffect(() => {
    (async () => {
      try {
        const [rawAccounts, rawSession, rawGlobal] = await Promise.all([
          AsyncStorage.getItem(K_ACCOUNTS),
          AsyncStorage.getItem(K_SESSION),
          AsyncStorage.getItem(K_GLOBAL),
        ]);
        let list: Account[] = rawAccounts ? JSON.parse(rawAccounts) : [];
        if (list.length === 0) {
          const salt = Crypto.randomUUID();
          list = [
            {
              id: Crypto.randomUUID(),
              name: DEFAULT_ADMIN.name,
              email: DEFAULT_ADMIN.email,
              role: 'admin',
              salt,
              hash: await hashPassword(salt, DEFAULT_ADMIN.password),
              disabled: false,
              createdAt: new Date().toISOString(),
            },
          ];
          await AsyncStorage.setItem(K_ACCOUNTS, JSON.stringify(list));
        }
        accountsRef.current = list;
        setAccounts(list);

        let g: GlobalData;
        if (rawGlobal) {
          g = JSON.parse(rawGlobal) as GlobalData;
        } else {
          g = { featured: FEATURED_SEED, announcement: null };
          await AsyncStorage.setItem(K_GLOBAL, JSON.stringify(g));
        }
        globalRef.current = g;
        setGlobal(g);

        if (rawSession && list.some((a) => a.id === rawSession && !a.disabled)) setSessionId(rawSession);
      } catch {
        // Start fresh if storage is unreadable.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const account = useMemo(
    () => accounts.find((a) => a.id === sessionId && !a.disabled) ?? null,
    [accounts, sessionId]
  );

  const register: AuthApi['register'] = useCallback(
    async (name, email, password) => {
      const n = name.trim();
      const e = email.trim().toLowerCase();
      if (n.length < 2) return 'Enter your name.';
      if (!isEmail(e)) return 'Enter a valid email address.';
      const pw = passwordProblem(password);
      if (pw) return pw;
      if (accountsRef.current.some((a) => a.email === e)) return 'An account with this email already exists.';

      const salt = Crypto.randomUUID();
      const acc: Account = {
        id: Crypto.randomUUID(),
        name: n,
        email: e,
        role: 'user',
        salt,
        hash: await hashPassword(salt, password),
        disabled: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      await saveAccounts([...accountsRef.current, acc]);
      await saveSession(acc.id);
      bus.emit('auth:signedIn', { name: acc.name });
      return null;
    },
    [saveAccounts, saveSession]
  );

  const login: AuthApi['login'] = useCallback(
    async (email, password) => {
      const e = email.trim().toLowerCase();
      const acc = accountsRef.current.find((a) => a.email === e);
      if (!acc || (await hashPassword(acc.salt, password)) !== acc.hash) return 'Email or password is incorrect.';
      if (acc.disabled) return 'This account is disabled. Ask an admin to enable it.';
      await saveAccounts(
        accountsRef.current.map((a) => (a.id === acc.id ? { ...a, lastLoginAt: new Date().toISOString() } : a))
      );
      await saveSession(acc.id);
      bus.emit('auth:signedIn', { name: acc.name });
      return null;
    },
    [saveAccounts, saveSession]
  );

  const logout = useCallback(() => {
    saveSession(null);
    bus.emit('auth:signedOut', {});
  }, [saveSession]);

  const changePassword: AuthApi['changePassword'] = useCallback(
    async (oldPassword, newPassword) => {
      const acc = accountsRef.current.find((a) => a.id === sessionId);
      if (!acc) return 'You are signed out.';
      if ((await hashPassword(acc.salt, oldPassword)) !== acc.hash) return 'Your current password is incorrect.';
      const problem = passwordProblem(newPassword);
      if (problem) return problem;
      const salt = Crypto.randomUUID();
      const hash = await hashPassword(salt, newPassword);
      await saveAccounts(accountsRef.current.map((a) => (a.id === acc.id ? { ...a, salt, hash } : a)));
      return null;
    },
    [saveAccounts, sessionId]
  );

  // ---------- admin ----------
  const setDisabled = useCallback(
    (id: string, disabled: boolean) =>
      saveAccounts(accountsRef.current.map((a) => (a.id === id ? { ...a, disabled } : a))),
    [saveAccounts]
  );

  const setRole = useCallback(
    (id: string, role: Role) => saveAccounts(accountsRef.current.map((a) => (a.id === id ? { ...a, role } : a))),
    [saveAccounts]
  );

  const resetPassword = useCallback(
    async (id: string) => {
      const temp = `Temp${Math.floor(1000 + Math.random() * 9000)}x`;
      const salt = Crypto.randomUUID();
      const hash = await hashPassword(salt, temp);
      await saveAccounts(accountsRef.current.map((a) => (a.id === id ? { ...a, salt, hash } : a)));
      return temp;
    },
    [saveAccounts]
  );

  const deleteUser = useCallback(
    async (id: string) => {
      await saveAccounts(accountsRef.current.filter((a) => a.id !== id));
      await AsyncStorage.removeItem(userKey(id));
    },
    [saveAccounts]
  );

  const saveFeatured = useCallback(
    (meal: Meal) => {
      const cur = globalRef.current;
      const exists = cur.featured.some((f) => f.id === meal.id);
      const featured = exists ? cur.featured.map((f) => (f.id === meal.id ? meal : f)) : [meal, ...cur.featured];
      return saveGlobal({ ...cur, featured });
    },
    [saveGlobal]
  );

  const deleteFeatured = useCallback(
    (id: string) => saveGlobal({ ...globalRef.current, featured: globalRef.current.featured.filter((f) => f.id !== id) }),
    [saveGlobal]
  );

  const setAnnouncement = useCallback(
    (text: string | null) => {
      const announcement: Announcement | null = text && text.trim() ? { text: text.trim(), updatedAt: new Date().toISOString() } : null;
      return saveGlobal({ ...globalRef.current, announcement });
    },
    [saveGlobal]
  );

  const loadStats = useCallback(async (): Promise<Stats> => {
    const list = accountsRef.current;
    const counts = new Map<string, number>();
    const stats: Stats = {
      users: list.filter((a) => a.role === 'user').length,
      admins: list.filter((a) => a.role === 'admin').length,
      disabled: list.filter((a) => a.disabled).length,
      planned: 0,
      cooked: 0,
      custom: 0,
      favorites: 0,
      featured: globalRef.current.featured.length,
      top: [],
    };
    for (const a of list) {
      try {
        const raw = await AsyncStorage.getItem(userKey(a.id));
        if (!raw) continue;
        const d = JSON.parse(raw) as Partial<UserData>;
        Object.values(d.plan ?? {}).forEach((day) =>
          Object.values(day).forEach((meal) => {
            if (!meal) return;
            stats.planned += 1;
            counts.set(meal.name, (counts.get(meal.name) ?? 0) + 1);
          })
        );
        stats.cooked += Object.keys(d.cooked ?? {}).length;
        stats.custom += (d.custom ?? []).length;
        stats.favorites += (d.favorites ?? []).length;
      } catch {
        // skip unreadable user data
      }
    }
    stats.top = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((x, y) => y.count - x.count)
      .slice(0, 5);
    return stats;
  }, []);

  const value = useMemo<AuthApi>(
    () => ({
      ready, account, accounts, global, register, login, logout, changePassword,
      setDisabled, setRole, resetPassword, deleteUser, saveFeatured, deleteFeatured, setAnnouncement, loadStats,
    }),
    [ready, account, accounts, global, register, login, logout, changePassword, setDisabled, setRole,
     resetPassword, deleteUser, saveFeatured, deleteFeatured, setAnnouncement, loadStats]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
