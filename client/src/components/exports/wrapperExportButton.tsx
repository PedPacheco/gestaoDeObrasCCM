"use client";

import dynamic from "next/dynamic";

const ExportButton = dynamic(
  () => import("@/components/exports/exportButton").then((m) => m.ExportButton),
  { ssr: false },
);

export default function WrapperExportButton(props: any) {
  return <ExportButton {...props} />;
}
