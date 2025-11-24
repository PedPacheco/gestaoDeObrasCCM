"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Bars3Icon } from "@heroicons/react/20/solid";

import { Sidebar } from "./Sidebar";

export function Header() {
  const [open, setOpen] = useState<boolean>(false);
  const pathname = usePathname();

  function changeOpen() {
    setOpen(!open);
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between p-2 bg-[#212E3E]">
        <button className="text-white lg:pl-6" onClick={() => changeOpen()}>
          <Bars3Icon className="block h-10 w-10" aria-hidden="true" />
        </button>

        <Image src="/Logo.png" alt="Logo sistema" width={360} height={92} />

        <div className="p-2 lg:pr-6">
          <Link href="/">
            <Image src="/edpLogo.png" alt="Edp Logo" width={120} height={92} />
          </Link>
        </div>
      </div>

      <Sidebar
        open={open}
        changeOpen={() => changeOpen()}
        pathname={pathname}
      />
    </>
  );
}
