"use client";

import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useState, useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [error]);

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <ErrorModal
      open={open}
      onClose={handleClose}
      message={error.message}
      icon={<ExclamationCircleIcon width={48} height={48} />}
    />
  );
}
