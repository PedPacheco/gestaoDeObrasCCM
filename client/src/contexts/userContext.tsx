"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Cookies } from "react-cookie";
import { jwtDecode } from "jwt-decode";

interface UserData {
  id: number;
  username: string;
  nome_usuario: string;
  email: string;
  tipo_usuario: string;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number | null;
  id_turma: number | null;
  id_area: number | null;
}

interface JwtPayload {
  sub: number;
  username: string;
  tipo_usuario: string;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_turma: number | null;
  id_area: number | null;
  exp: number;
}

interface LoginResponse {
  message: string;
  success: boolean;
}

interface UserContextType {
  user: UserData | null;
  permissions: JwtPayload | null;
  isLoading: boolean;
  login: (user: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | null>(null);
const cookies = new Cookies();

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [permissions, setPermissions] = useState<JwtPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** 🔹 Init */
  useEffect(() => {
    const token = cookies.get("token");
    const userInfo = cookies.get("userInfo");

    if (!token || !userInfo) {
      clearAuth();
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);

      if (decoded.exp * 1000 < Date.now()) {
        clearAuth();
        return;
      }

      setPermissions(decoded);
      setUser(typeof userInfo === "string" ? JSON.parse(userInfo) : userInfo);
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** 🔹 Login */
  async function login(user: string, password: string): Promise<LoginResponse> {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, message: result.message };
    }

    // força revalidação do contexto
    window.location.replace("/");
    return { success: true, message: result.message };
  }

  /** 🔹 Logout */
  function logout() {
    clearAuth();
    window.location.replace("/login");
  }

  function clearAuth() {
    cookies.remove("token", { path: "/" });
    cookies.remove("userInfo", { path: "/" });
    setUser(null);
    setPermissions(null);
    setIsLoading(false);
  }

  return (
    <UserContext.Provider
      value={{ user, permissions, isLoading, login, logout }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}
