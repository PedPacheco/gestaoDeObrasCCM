"use client";

import { DocumentCheckIcon } from "@heroicons/react/20/solid";
import { Box, IconButton, TableCell, Tooltip } from "@mui/material";

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

interface FilesCellProps {
  paths: string[];
  onOpenFile?: (path: string) => void;
}

export function FilesCell({ paths, onOpenFile }: FilesCellProps) {
  if (paths.length === 0) {
    return <span className="text-zinc-400">-</span>;
  }

  const handleClick = (path: string) => {
    if (onOpenFile) {
      onOpenFile(path);
      return;
    }
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <TableCell className="border-r border-solid border-zinc-700 px-2 py-2 text-center text-sm font-medium md:text-base xl:text-lg">
      {paths.map((path, index) => (
        <Tooltip
          key={`${path}-${index}`}
          title={getFileName(path)}
          placement="top"
        >
          <IconButton
            size="small"
            color="primary"
            onClick={() => handleClick(path)}
            aria-label={`Abrir ficheiro ${getFileName(path)}`}
            sx={{
              padding: "4px",
              "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.08)" },
            }}
          >
            <DocumentCheckIcon width={26} height={26} />
          </IconButton>
        </Tooltip>
      ))}
    </TableCell>
  );
}
