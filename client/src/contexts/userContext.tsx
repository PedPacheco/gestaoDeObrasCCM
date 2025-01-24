"use client";

import { jwtDecode } from "jwt-decode";
import nookies from "nookies";
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
  id_regional: string;
  nome_usuario: string;
  email: string;
}

interface JwtPayload {
  id: number;
  username: string;
  permissao: string;
  permissao_visualizacao: string;
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = nookies.get(null).userInfo;
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [permissions, setPermissions] = useState<JwtPayload | null>(() => {
    const token = nookies.get(null).token;
    return token ? jwtDecode<JwtPayload>(token) : null;
  });

  console.log(permissions);

  async function login(user: string, password: string): Promise<LoginResponse> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          password,
        }),
        credentials: "include",
      }
    );

    if (response.ok) {
      const res = await response.json();

      setUser(res.data);

      nookies.set(null, "userInfo", JSON.stringify(res.data), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });

      return { message: res.message, success: true };
    } else {
      const error = await response.json();
      return { message: error.message, success: false };
    }
  }

  function logout() {
    setUser(null);
    nookies.destroy(null, "userInfo");
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
