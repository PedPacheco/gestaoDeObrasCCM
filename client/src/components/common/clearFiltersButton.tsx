"use client";

import { clearParams } from "@/actions/clearParams.action";
import { Button, ButtonProps } from "@mui/material";

interface ButtonComponentProps extends ButtonProps {
  url: string;
  text: string;
  styled?: string;
}

export function ClearFiltersButton({
  url,
  text,
  styled,
  ...props
}: ButtonComponentProps) {
  return (
    <Button
      {...props}
      onClick={() => clearParams(url)}
      className={`${styled} h-10 text-zinc-200 hover:text-[#53FF75] bg-[#212E3E] hover:bg-[#394658] text-xs xl:text-sm`}
    >
      {text}
    </Button>
  );
}
