// components/ui/FormCard.tsx
"use client";

import { Box, Typography } from "@mui/material";

export function ScheduleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Box className="bg-white rounded-xl shadow p-0 flex flex-col h-full">
      <Box className="px-6 py-4 border-b">
        <Typography className="text-xl font-semibold text-gray-700">
          {title}
        </Typography>
      </Box>

      <Box className="px-6 py-4 overflow-y-auto flex-1">{children}</Box>
    </Box>
  );
}
