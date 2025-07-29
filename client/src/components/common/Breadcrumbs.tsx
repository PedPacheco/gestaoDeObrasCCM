"use client";

import { links } from "@/utils/links";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { Breadcrumbs, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BreadcrumpsComponent() {
  const pathname = usePathname();

  function generateBreadcrumbs(links: any, pathname: any) {
    const pathnames = pathname?.split("/").filter(Boolean) || [];
    let breadcrumbs: any = [];
    let accumulatedPath = "";

    pathnames.forEach((segment: any) => {
      accumulatedPath += `/${segment}`;

      const matchingLink = findLinkByHref(links, accumulatedPath);

      if (matchingLink) {
        breadcrumbs.push({
          name: matchingLink.name,
          href: accumulatedPath,
        });
      }
    });

    return breadcrumbs;
  }

  function findLinkByHref(links: any, href: any): any {
    for (let link of links) {
      if (link.href === href) {
        return link;
      }
      if (link.submenu) {
        const foundInSubmenu = findLinkByHref(link.submenu, href);
        if (foundInSubmenu) return foundInSubmenu;
      }
    }
    return null;
  }

  const breadcrumbs = generateBreadcrumbs(links, pathname);

  return (
    <div>
      <Breadcrumbs
        className="custom-breadcrumb"
        separator={
          <ChevronRightIcon
            fontSize="small"
            className="text-zinc-700 block h-8 w-8"
          />
        }
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((breadcrumb: any, index: any) => {
          const last = index === breadcrumbs.length - 1;
          return last ? (
            <Typography
              className="text-xl font-semibold text-zinc-700 min-w-32 p-2 flex justify-center"
              key={breadcrumb.href}
            >
              {breadcrumb.name}
            </Typography>
          ) : (
            <Link
              className="hover:bg-zinc-300 transition-colors p-2 flex justify-center rounded"
              href={breadcrumb.href}
              key={breadcrumb.href}
            >
              <p className="text-xl font-semibold">{breadcrumb.name}</p>
            </Link>
          );
        })}
      </Breadcrumbs>
    </div>
  );
}
