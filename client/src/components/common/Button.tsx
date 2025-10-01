"use client";

import { Button, ButtonProps } from "@mui/material";
import { ReactNode } from "react";

interface ButtonComponentProps extends ButtonProps {
  text: string | ReactNode;
  styled?: string;
}

export function ButtonComponent({
  text,
  styled,
  ...props
}: ButtonComponentProps) {
  return (
    <Button
      {...props}
      className={`${styled} h-10 text-zinc-200 hover:text-[#53FF75] bg-[#212E3E] hover:bg-[#394658] disabled:opacity-85 disabled:text-zinc-300 text-xs xl:text-base`}
    >
      {text}
    </Button>
  );
}
