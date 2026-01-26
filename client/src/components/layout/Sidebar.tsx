"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useUser } from "@/contexts/userContext";
import { links } from "@/utils/links";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { Input } from "@mui/material";

interface SidebarProps {
  open: boolean;
  changeOpen: () => void;
  pathname: string;
}

export function Sidebar({ open, changeOpen, pathname }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [work, setWork] = useState<string>("");
  const router = useRouter();
  const { permissions } = useUser();

  const sidebarRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);

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
    <>
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 z-40 h-full bg-[#212E3E] overflow-y-auto transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="relative flex-1 overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              work && router.push(`/detalhes/${work}`);
            }}
          >
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
                  <button type="submit" className="absolute right-0 mr-4">
                    <MagnifyingGlassIcon
                      width={24}
                      height={24}
                      color="#53FF75"
                    />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <nav className="flex flex-col px-3 pb-3.5 mt-4">
            <div className="flex flex-col gap-2">
              {links.map((link, index) => {
                if (!isClient) return null;

                if (
                  link.needPermission &&
                  (permissions?.permissao_visualizacao === "parcial" ||
                    permissions?.permissao === "Sem permissão")
                ) {
                  return null;
                }

                return (
                  <div key={index} className="w-full">
                    <div
                      className={`flex justify-between items-center rounded-md transition-colors ${
                        pathname === link.href
                          ? "bg-[#5a6c83] text-[#53FF75]"
                          : "text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
                      }`}
                    >
                      {link.href ? (
                        <Link
                          href={`${link.href}`}
                          className={`text-base w-full font-medium leading-8 p-2`}
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <span
                          className={`text-base w-full font-medium leading-8 p-2`}
                        >
                          {link.name}
                        </span>
                      )}

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
                        {link.submenu.map((subItem, subIndex) => {
                          if (
                            subItem.needPermission &&
                            (permissions?.permissao_visualizacao ===
                              "parcial" ||
                              permissions?.permissao === "Sem permissão")
                          ) {
                            return null;
                          }

                          return (
                            <li key={subIndex}>
                              <Link
                                href={`${subItem.href}`}
                                className={`block rounded-md text-sm p-2 font-medium leading-8 bg-[#324153] my-1 transition-colors ${
                                  pathname === subItem.href
                                    ? "bg-[#5a6c83] text-[#53FF75]"
                                    : "text-zinc-200 hover:bg-[#1a2635] hover:text-[#53FF75]"
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
      </div>
    </>
  );
}
