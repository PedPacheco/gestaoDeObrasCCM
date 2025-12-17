"use client";

import { jwtDecode } from "jwt-decode";
import { Cookies } from "react-cookie";
import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface UserData {
  id: number;
  username: string;
  id_regional: number;
  nome_usuario: string;
  email: string;
}

interface JwtPayload {
  id: number;
  username: string;
  permissao: string;
  permissao_visualizacao: string;
  permissao_publicacao: boolean;
}

interface LoginResponse {
  message: string;
  success: boolean;
}

interface UserContextType {
  user: UserData | null;
  permissions: JwtPayload | null;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  login: (user: string, password: string) => Promise<LoginResponse>;
}

const UserContext = createContext<UserContextType | null>(null);
const cookies = new Cookies();

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = cookies.get("userInfo");
    return storedUser ? storedUser : null;
  });

  const [permissions, setPermissions] = useState<JwtPayload | null>(() => {
    const token = cookies.get("token");
    return token ? jwtDecode<JwtPayload>(token) : null;
  });

  async function login(user: string, password: string): Promise<LoginResponse> {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, password }),
      credentials: "include",
    });

    if (response.ok) {
      const res = await response.json();

      const token = cookies.get("token");
      if (token) {
        setPermissions(jwtDecode<JwtPayload>(token));
      }

      return { message: res.message, success: true };
    } else {
      const error = await response.json();
      return { message: error.message, success: false };
    }
  }

  function logout() {
    setUser(null);
    cookies.remove("userInfo");
  }

  return (
    <UserContext.Provider value={{ user, permissions, setUser, login }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
