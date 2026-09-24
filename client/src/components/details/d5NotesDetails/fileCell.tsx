"use client";

import { DocumentCheckIcon } from "@heroicons/react/20/solid";
import { IconButton, TableCell, Tooltip } from "@mui/material";

interface FilesCellProps {
  paths: string[];
  onOpenFile?: (path: string) => void;
}

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export function FilesCell({ paths, onOpenFile }: FilesCellProps) {
  const cellClass =
    "border-r border-solid border-zinc-700 px-2 py-2 text-center text-sm font-medium md:text-base xl:text-lg";

  const handleClick = (path: string) => {
    if (onOpenFile) {
      onOpenFile(path);
      return;
    }
    window.open(path, "_blank", "noopener,noreferrer");
  };

  if (paths.length === 0) {
    return (
      <TableCell className={cellClass}>
        <span className="text-zinc-400">-</span>
      </TableCell>
    );
  }

  return (
    <TableCell className={cellClass}>
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
