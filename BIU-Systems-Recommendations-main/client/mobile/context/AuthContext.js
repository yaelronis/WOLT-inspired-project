// @ts-check

import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";

/** @typedef {import("../../../api/src/model/users.js").User} User */
/** @typedef {Omit<User, "password">} UserData */

/**
 * @typedef {Object} AuthValue
 * @property {string | null} token
 * @property {UserData | null} user
 * @property {boolean} isLoading
 * @property {(jwt: string, user: any) => Promise<void>} login
 * @property {() => Promise<void>} logout
 */

const AuthContext = createContext(/** @type {AuthValue | null} */(null));

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";


/**
 * Decode a JWT payload (the middle segment) without verifying the signature.
 * Safe for reading our own non-sensitive claims (e.g. user_id) for display.
 * Returns {} if the token is missing or malformed.
 * @param {string | null} jwt
 * @returns {Record<string, any>}
 */
function decodeJwtPayload(jwt) {
  try {
    if (!jwt) return {};
    const payload = jwt.split(".")[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );
    return json;
  } catch {
    return {};
  }
}

/** @param {{ children: any }} props */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(/** @type {string | null} */(null));
  const [user, setUser] = useState(/** @type {UserData | null} */(null));
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function loadStoredAuth() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        if (storedToken) setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            await AsyncStorage.removeItem(USER_KEY);
          }
        }
      } catch (e) {
        console.error("Failed to load", e)
      } finally {
        setIsLoading(false);
      }
    }

    loadStoredAuth();
  }, []);

  // Once logged in, make sure we know the user's role (owner vs user).
  // The login response and JWT don't include it, so fetch the user once and
  // cache it. role resolves to a string or null so guards can tell "loading"
  // (undefined) from "resolved, not an owner" (null/other).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!token) return;
      const res = await api.affirmjwt(token);
      if (res.status !== 200) {
        await logout();
        return;
      }
      if (cancelled) return;
      const body = await res.json();
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(body));
      setUser(body);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Save the JWT + user info after a successful login or registration.
  // The user_id is read from the token so the rest of the app (like the main
  // page) can use user.id- useAuth() without decoding the JWT itself.
  const login = async (/** @type {string} */ jwt, /** @type {any} */ userData) => {
    const { user_id } = decodeJwtPayload(jwt);
    const fullUser = { ...userData, id: user_id };

    setToken(jwt);
    setUser(fullUser);

    await AsyncStorage.setItem(TOKEN_KEY, jwt);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fullUser));
  };

  const logout = async () => {
    setToken(null);
    setUser(null);

    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}