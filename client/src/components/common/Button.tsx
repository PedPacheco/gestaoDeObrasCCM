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
      className={styled}
      sx={{
        height: 48,
        fontSize: { xs: "0.75rem", xl: "1rem" },
        lineHeight: { xs: "1rem", xl: "1.5rem" },
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
