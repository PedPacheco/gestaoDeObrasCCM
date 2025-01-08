"use client";

import { FormEvent, useState } from "react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { Input } from "@mui/material";
import { links } from "@/utils/links";
import { useRouter } from "next/navigation";

interface SidebarProps {
  open: boolean;
  changeOpen: () => void;
  pathname: string;
}

export function Sidebar({ open, changeOpen, pathname }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [work, setWork] = useState<string>("");
  const router = useRouter();

  function handleToogleSubmenu(menu: string, event: React.MouseEvent) {
    event.stopPropagation();
    setOpenSubmenu(openSubmenu === menu ? null : menu);
  }

  return (
    <>
      <div
        className={`fixed top-0 left-0 z-20 h-full bg-[#212E3E] transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="relative h-full flex flex-col">
          {open && (
            <div className="absolute right-[-48px] top-0 pt-3.5 opacity-100">
              <button
                className="ml-1 mt-2 flex h-10 w-10 items-center justify-center bg-[#53FF75] rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={changeOpen}
              >
                <XMarkIcon
                  className="h-8 w-8 text-zinc-700"
                  aria-hidden="true"
                />
              </button>
            </div>
          )}

          <div className="relative flex-1 overflow-y-auto">
            <div className="sticky top-0 bg-[#212E3E] pt-3.5">
              <div className="pb-0.5">
                <div className="group flex h-10 items-center gap-2 rounded-lg bg-[#212E3E] px-2 font-medium">
                  <Input
                    type="text"
                    className="grow overflow-hidden text-ellipsis whitespace-nowrap text-sm md:text-base text-zinc-200 px-2 bg-[#404d5e] rounded-xl"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      setWork(event.target.value)
                    }
                  />
                  <button
                    className="absolute right-0 mr-4"
                    onClick={() => router.push(`/detalhes/${work}`)}
                  >
                    <MagnifyingGlassIcon
                      width={24}
                      height={24}
                      color="#53FF75"
                    />
                  </button>
                </div>
              </div>
            </div>

            <nav className="flex flex-col px-3 pb-3.5 mt-4">
              <div className="flex flex-col gap-2">
                {links.map((link, index) => (
                  <div key={index} className="w-full">
                    <div
                      className={`flex justify-between items-center rounded-md transition-colors ${
                        pathname === link.href
                          ? "bg-[#1a2635] text-[#53FF75]"
                          : "text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
                      }`}
                    >
                      <Link
                        href={`${link.href}`}
                        className="text-base w-full font-medium leading-8 p-2"
                      >
                        {link.name}
                      </Link>
                      {link.submenu && (
                        <button
                          onClick={(e) => handleToogleSubmenu(link.name, e)}
                          className="text-zinc-200 hover:text-[#53FF75] ml-auto"
                        >
                          {openSubmenu === link.name ? (
                            <ChevronUpIcon className="h-5 w-5" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>

                    {link.submenu && (
                      <ul
                        className={`transition-all duration-300 ml-2 ease-in-out overflow-hidden ${
                          openSubmenu === link.name
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        {link.submenu.map((subItem, subIndex) => (
                          <li key={subIndex}>
                            <Link
                              href={`${subItem.href}`}
                              className={`block rounded-md text-sm p-2 font-medium leading-8 transition-colors ${
                                pathname === subItem.href
                                  ? "bg-[#1a2635] text-[#53FF75]"
                                  : "text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
                              }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
