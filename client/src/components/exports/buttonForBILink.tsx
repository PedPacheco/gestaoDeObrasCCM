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

  return (
    <>
      {permissions?.permissao_visualizacao === "parcial" && !visible ? null : (
        <Box
          sx={{
            display: "flex",
            flexDirection: compact ? "column" : "row",
            alignItems: compact ? "flex-start" : "center",
            justifyContent: compact ? "flex-start" : "space-between",
            borderBottom: "1px solid #e2e8f0",
            py: compact ? 1.5 : 2,
            gap: compact ? 1 : 0,
          }}
        >
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: compact ? 13 : 20,
              textTransform: "uppercase",
              paddingRight: compact ? 0 : { xs: 1, md: 8 },
            }}
          >
            {text}
          </Typography>
          <Link
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className={
              compact
                ? "w-full h-9 text-center text-xs rounded-sm flex items-center justify-center bg-[#212E3E] text-[#E4E4E7] hover:bg-[#394658] hover:text-[#53FF75] transition-colors"
                : "min-w-48 h-12 text-center text-xs xl:text-base rounded-sm flex items-center justify-center bg-[#212E3E] text-[#E4E4E7] hover:bg-[#394658] hover:text-[#53FF75] transition-colors"
            }
          >
            Ir para o BI
          </Link>
        </Box>
      )}
    </>
  );
}
