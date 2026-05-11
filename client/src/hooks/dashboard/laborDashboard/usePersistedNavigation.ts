"use client";

export function usePersistedNavigation() {
  function openWithFiltersInNewTab(
    cookieName: string,
    filters: any,
    path: string,
  ) {
    // 1. salva cookie
    document.cookie = `${cookieName}=${encodeURIComponent(
      JSON.stringify(filters),
    )}; path=/`;

    // 2. abre nova aba
    window.open(path, "_blank");
  }

  return { openWithFiltersInNewTab };
}
