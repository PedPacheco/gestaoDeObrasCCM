import { alpha } from "@mui/material/styles";
import * as React from "react";

export const FILTER_MENU_MAX_HEIGHT = 400;
export const FILTER_LIMIT_TAGS = 2;

// Layout comum aos dois componentes
export const filterRootProps = {
  className: "lg:ml-4 lg:first:ml-0 w-full",
  sx: { marginBottom: "0.5rem" },
} as const;

export const formatLabel = (label: string) => label.replaceAll("_", " ");

export const safeAlpha = (color: string | undefined, value: number) => {
  if (!color) return undefined;
  try {
    return alpha(color, value);
  } catch {
    return undefined;
  }
};

export function useFilterStyles(backgroundColor?: string, textColor?: string) {
  return React.useMemo(() => {
    const hoverColor = safeAlpha(textColor, 0.08);
    const selectedColor = safeAlpha(textColor, 0.16);
    const subtleColor = safeAlpha(textColor, 0.6) ?? textColor;

    // Campo: input, label, borda, ícones e chips
    const fieldSx = {
      "& .MuiOutlinedInput-root": {
        backgroundColor,
        color: textColor,
        "& .MuiOutlinedInput-notchedOutline": { borderColor: subtleColor },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: textColor,
        },
      },
      "& .MuiInputLabel-root": { color: subtleColor },
      "& .MuiInputLabel-root.Mui-focused": { color: textColor },
      "& .MuiSvgIcon-root": { color: textColor }, // seta, limpar, etc.
      "& .MuiChip-root": {
        color: textColor,
        backgroundColor: hoverColor,
        "& .MuiChip-deleteIcon": { color: subtleColor },
      },
      "& .MuiAutocomplete-tag": { color: textColor }, // "+N"
    };

    // Menu: Paper + opções (MenuItem e Autocomplete option)
    const paperSx = {
      backgroundColor,
      color: textColor,
      maxHeight: FILTER_MENU_MAX_HEIGHT,
      "& .MuiMenuItem-root:hover, & .MuiMenuItem-root.Mui-focusVisible, & .MuiAutocomplete-option.Mui-focused":
        { backgroundColor: hoverColor },
      "& .MuiMenuItem-root.Mui-selected, & .MuiAutocomplete-option[aria-selected='true'], & .MuiAutocomplete-option[aria-selected='true'].Mui-focused":
        { backgroundColor: selectedColor },
      "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": {
        color: subtleColor,
      },
      "& .MuiCheckbox-root": { color: subtleColor },
      "& .MuiCheckbox-root.Mui-checked": { color: textColor },
    };

    return { fieldSx, paperSx, hoverColor, subtleColor };
  }, [backgroundColor, textColor]);
}
