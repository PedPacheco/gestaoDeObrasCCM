"use client";

import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface ScheduleTopbarProps {
  title: string;
  idWork: number;
  date?: string;
}

export function ScheduleTopbar({ title, idWork, date }: ScheduleTopbarProps) {
  const today =
    date ??
    new Date().toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="col-span-full flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div>
        <Breadcrumbs
          separator={<ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />}
          aria-label="breadcrumb"
        >
          <Link
            underline="hover"
            color="text.secondary"
            href={`/detalhes/${idWork}`}
            className="text-xs"
          >
            Detalhes da obra
          </Link>
          <Link
            underline="hover"
            color="text.secondary"
            href={`/detalhes/${idWork}`}
            className="text-xs"
          >
            Programações
          </Link>
          <Typography color="text.primary" className="text-xs">
            {title}
          </Typography>
        </Breadcrumbs>
        <h1 className="mt-0.5 text-[15px] font-medium text-gray-900">
          {title}
        </h1>
      </div>
      <span className="text-xs text-gray-400">{today}</span>
    </div>
  );
}
