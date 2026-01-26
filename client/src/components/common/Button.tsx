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
      className={`${styled} h-12 text-xs xl:text-base`}
      sx={{
        color: "#E4E4E7",
        backgroundColor: "#212E3E",
        "&:hover": {
          color: "#53FF75",
          backgroundColor: "#394658",
        },
        "&.Mui-disabled": {
          opacity: 0.85,
          color: "#A1A1AA",
        },
      }}
    >
      {text}
    </Button>
  );
}
