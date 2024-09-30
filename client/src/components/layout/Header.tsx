"use client";

import { Bars3Icon } from "@heroicons/react/20/solid";
import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Header() {
  const [open, SetOpen] = useState<boolean>(false);
  const pathname = usePathname();

  function changeOpen() {
    SetOpen(!open);
  }

  return (
    <div className="absolute w-full">
      <div
        className={`sticky top-0 z-10 flex min-h-14 items-center justify-between px-2 bg-[#212E3E]`}
      >
        <button className="text-white ml-6" onClick={() => changeOpen()}>
          <Bars3Icon className="block h-8 w-8" aria-hidden="true" />
        </button>

        <div className="p-2 mr-6">
          <Link href="/">
            <Image src="/edpLogo.png" alt="Edp Logo" width={102} height={92} />
          </Link>
        </div>
      </div>

      <Sidebar
        open={open}
        changeOpen={() => changeOpen()}
        pathname={pathname}
      />
    </div>
  );
}
