"use client";

import { UserProvider } from "@/contexts/userContext";

export const UserProviderWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <UserProvider>{children}</UserProvider>;
};
