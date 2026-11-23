"use client";
import { Button, ButtonProps, SxProps, Theme } from "@mui/material";
import { ReactNode } from "react";

interface ButtonComponentProps extends ButtonProps {
  text: string | ReactNode;
  styled?: string;
}

const baseSx: SxProps<Theme> = {
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
};

export function ButtonComponent({
  text,
  styled,
  sx,
  ...props
}: ButtonComponentProps) {
  return (
    <Button
      {...props}
      className={styled}
      sx={[baseSx, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {text}
    </Button>
  );
}
