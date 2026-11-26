"use client";

import {
  openProtectedFile,
  parseStoredFiles,
  type StorageKind,
} from "@/lib/protectedFiles";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { IconButton, Tooltip } from "@mui/material"; // ajuste ao import que você já usa
import { useState } from "react";

export const LOCAL_INLINE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

interface Props {
  tipo: StorageKind;
  value?: string | null; // conteúdo de caminho_arquivo
}

export function ProtectedFileLinks({ tipo, value }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const nomes = parseStoredFiles(value);

  if (!nomes.length) return null;

  const handleOpen = async (nome: string) => {
    setLoading(nome);
    try {
      await openProtectedFile(tipo, nome);
    } catch {
      alert("Não foi possível abrir o arquivo."); // troque pelo toast do projeto
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {nomes.map((nome) => (
        <Tooltip key={nome} title={nome}>
          <span>
            <IconButton
              onClick={() => handleOpen(nome)}
              disabled={loading === nome}
              aria-label={`Abrir ${nome}`}
              className="hover:scale-110 transition-transform"
            >
              <DocumentTextIcon width={30} height={30} />
            </IconButton>
          </span>
        </Tooltip>
      ))}
    </>
  );
}
