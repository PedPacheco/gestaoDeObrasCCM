"use client";

export function ErrorThrower({ message }: { message: string }): never {
  throw new Error(message);
}
