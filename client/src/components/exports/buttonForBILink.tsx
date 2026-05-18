"use client";

import "dayjs/locale/pt-br";

import { useUser } from "@/contexts/userContext";
import { Box, Typography } from "@mui/material";

import Link from "next/link";

interface ButtonForBILinkProps {
  text: string;
  path: string;
  visible: boolean;
  compact?: boolean;
}

export function ButtonForBILink({ text, path, visible, compact = false }: ButtonForBILinkProps) {
  const { permissions } = useUser();

  if (permissions?.permissao_visualizacao === "parcial" && !visible) return null;

  if (compact) {
    return (
      <Link
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="w-9 h-9 rounded-md flex items-center justify-center bg-[#212E3E] text-[#E4E4E7] hover:bg-[#394658] hover:text-[#53FF75] transition-colors shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e2e8f0",
        py: 2,
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 20, textTransform: "uppercase", paddingRight: { xs: 1, md: 8 } }}>
        {text}
      </Typography>
      <Link
        href={path}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-48 h-12 text-xs xl:text-base rounded-sm flex items-center justify-center gap-2 bg-[#212E3E] text-[#E4E4E7] hover:bg-[#394658] hover:text-[#53FF75] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </Link>
    </Box>
  );
}
