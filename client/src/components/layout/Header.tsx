"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Bars3Icon } from "@heroicons/react/20/solid";
import { useSidebar } from "@/contexts/sidebarContext";
import { Sidebar } from "./Sidebar";

export function Header() {
  const { open, toggle } = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <div className="sticky top-0 z-10 flex min-h-14 items-center justify-between p-2 bg-[#212E3E]">
        <button className="text-white lg:pl-6" onClick={toggle}>
          <Bars3Icon className="block h-10 w-10" aria-hidden="true" />
        </button>

        <div className="p-2 lg:pr-6">
          <Link href="/">
            <Image src="/edpLogo.png" alt="Edp Logo" width={120} height={92} />
          </Link>
        </div>
      </div>

      <Sidebar open={open} changeOpen={toggle} pathname={pathname} />
    </>
  );
}
