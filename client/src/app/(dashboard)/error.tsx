"use client";

import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Error({ error }: { error: Error }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setOpen(true);
  }, [error]);

  const handleClose = () => {
    setOpen(false);
    router.push("/");
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
