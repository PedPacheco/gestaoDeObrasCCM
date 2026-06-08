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
      <div className="sticky top-0 z-30 flex min-h-16 items-center justify-between p-2 bg-[#212E3E]">
        <button className="text-white lg:pl-6" onClick={() => changeOpen()}>
          <Bars3Icon className="block h-10 w-10" aria-hidden="true" />
        </button>

        <div className="h-14 w-[460px] relative ml-20">
          <Image
            src="/novo-logo-sigo.png"
            alt="Sigo logo"
            fill
            className="object-contain"
            priority
          />
        </div>

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
