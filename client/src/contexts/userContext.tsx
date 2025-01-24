"use client";

import {
  createContext,
  useContext,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import nookies from "nookies";

interface UserData {
  id: number;
  username: string;
  permissao: string;
  id_regional: string;
  nome_usuario: string;
  email: string;
  permissao_visualizacao: string;
}

interface LoginResponse {
  message: string;
  success: boolean;
}

interface UserContextType {
  user: UserData | null;
  setUser: Dispatch<SetStateAction<UserData | null>>;
  login: (user: string, password: string) => Promise<LoginResponse>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(() => {
    const storedUser = nookies.get(null).userInfo;
    return storedUser ? JSON.parse(storedUser) : null;
  });

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
    <UserContext.Provider value={{ user, setUser, login }}>
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
