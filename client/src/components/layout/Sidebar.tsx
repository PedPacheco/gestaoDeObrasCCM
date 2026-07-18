"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useUser } from "@/contexts/userContext";
import { canAccessLink, links } from "@/utils/links";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { Input } from "@mui/material";
import Image from "next/image";

interface SidebarProps {
  open: boolean;
  changeOpen: () => void;
  pathname: string;
}

export function Sidebar({ open, changeOpen, pathname }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [work, setWork] = useState<string>("");
  const [isClient, setIsClient] = useState<boolean>(false);

  const router = useRouter();
  const { permissions } = useUser();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        open &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        changeOpen();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, changeOpen]);

  function handleToogleSubmenu(menu: string, event: React.MouseEvent) {
    event.stopPropagation();
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  }

  return (
    <div
      ref={sidebarRef}
      className={`fixed top-0 left-0 z-40 h-full bg-[#212E3E] transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "-translate-x-full"
      } w-64 flex flex-col`}
    >
      {/* 🔹 CONTEÚDO SCROLLÁVEL */}
      <div className="flex-1 overflow-y-auto">
        {/* 🔍 SEARCH */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (work) router.push(`/detalhes/${work}`);
          }}
        >
          <div className="sticky top-0 bg-[#212E3E] pt-3.5 px-2">
            <div className="flex h-10 items-center gap-2 rounded-lg px-2">
              <Input
                type="text"
                className="grow text-sm md:text-base text-zinc-200 px-2 bg-[#404d5e] rounded-xl"
                onChange={(e) => setWork(e.target.value)}
              />
              <button type="submit">
                <MagnifyingGlassIcon width={24} height={24} color="#53FF75" />
              </button>
            </div>
          </div>
        </form>

        {/* 📌 NAV */}
        <nav className="flex flex-col px-3 pb-4 mt-4">
          <div className="flex flex-col gap-2">
            {links.map((link, index) => {
              if (!isClient) return null;

              if (!canAccessLink(link, permissions)) return null;

              return (
                <div key={index}>
                  <div
                    className={`flex items-center justify-between rounded-md ${
                      pathname === link.href
                        ? "bg-[#5a6c83] text-[#53FF75]"
                        : "text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
                    }`}
                  >
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="w-full p-2 text-base font-medium"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <span className="w-full p-2 text-base font-medium">
                        {link.name}
                      </span>
                    )}

                    {link.submenu && (
                      <button
                        onClick={(e) => handleToogleSubmenu(link.name, e)}
                      >
                        {openSubmenu === link.name ? (
                          <ChevronUpIcon className="h-5 w-5" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* SUBMENU */}
                  {link.submenu && (
                    <ul
                      className={`transition-all duration-300 ml-2 overflow-hidden ${
                        openSubmenu === link.name
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      {link.submenu.map((subItem, subIndex) => {
                        if (!canAccessLink(subItem, permissions)) return null;

                        return (
                          <li key={subIndex}>
                            <Link
                              href={subItem.href || ""}
                              className={`block rounded-md text-sm p-2 my-1 ${
                                pathname === subItem.href
                                  ? "bg-[#5a6c83] text-[#53FF75]"
                                  : "bg-[#324153] text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {/* 🔻 FOOTER FIXO (LOGO) */}
      <div className="flex justify-center items-center pb-4 pr-6 border-t border-[#2f3c4f]">
        <Image
          src="/logo-sigo.png"
          alt="Edp Logo"
          width={180}
          height={140}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
