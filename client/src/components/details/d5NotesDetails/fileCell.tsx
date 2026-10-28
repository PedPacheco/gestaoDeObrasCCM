"use client";
import { DocumentTextIcon } from "@heroicons/react/20/solid";
import { IconButton, TableCell, Tooltip } from "@mui/material";

interface FilesCellProps {
  paths: string[];
  getFileUrl: (path: string) => string;
}

function getFileName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

const cellClass =
  "border-r border-solid border-zinc-700 px-2 py-2 text-center text-sm font-medium md:text-base xl:text-lg";

export function FilesCell({ paths, getFileUrl }: FilesCellProps) {
  if (paths.length === 0) {
    return (
      <TableCell className={cellClass}>
        <span className="text-zinc-400">-</span>
      </TableCell>
    );
  }

  return (
    <TableCell className={`${cellClass} whitespace-nowrap`}>
      {paths.map((path, index) => {
        const fileName = getFileName(path);

        return (
          <Tooltip key={`${path}-${index}`} title={fileName} placement="top">
            <IconButton
              component="a"
              href={getFileUrl(path)}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              color="primary"
              aria-label={`Abrir ficheiro ${fileName}`}
              className="transition-transform hover:scale-110"
            >
              <DocumentTextIcon width={30} height={30} />
            </IconButton>
          </Tooltip>
        );
      })}
    </TableCell>
  );
}
