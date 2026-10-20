import { FilterOption } from "@/types/genericFilterSchema";
import {
  alpha,
  Autocomplete,
  Checkbox,
  styled,
  TextField,
} from "@mui/material";
import { useVirtualizer } from "@tanstack/react-virtual";
import React from "react";

type ListboxProps = React.ComponentProps<"ul">;

const LISTBOX_MAX_HEIGHT = 460;
const ITEM_HEIGHT = 40;

const StyledListbox = styled("ul")({
  margin: 0,
  padding: "8px 0",
  listStyle: "none",
  maxHeight: LISTBOX_MAX_HEIGHT,
  overflow: "auto",
  position: "relative",
  backgroundColor: "inherit",
});

export const VirtualizedListbox = React.forwardRef<
  HTMLUListElement,
  ListboxProps
>(function VirtualizedListbox(props, ref) {
  const { children, ...other } = props;
  const items = React.Children.toArray(children) as React.ReactElement[];

  const listRef = React.useRef<HTMLUListElement | null>(null);

  const handleRef = React.useCallback(
    (node: HTMLUListElement | null) => {
      listRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 8,
  });

  return (
    <StyledListbox ref={handleRef} {...other}>
      {/* spacer: define a altura total do scroll */}
      <li
        aria-hidden
        style={{
          height: virtualizer.getTotalSize(),
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      />

      {virtualizer.getVirtualItems().map((vr) => {
        const child = items[vr.index];
        if (!child) return null;

        return React.cloneElement(child, {
          key: vr.key,
          "data-index": vr.index,
          style: {
            ...(child.props.style ?? {}),
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: vr.size,
            transform: `translateY(${vr.start}px)`,
          },
        });
      })}
    </StyledListbox>
  );
});

const safeAlpha = (color: string | undefined, value: number) => {
  if (!color) return undefined;
  try {
    return alpha(color, value);
  } catch {
    return undefined;
  }
};

interface VirtualizedMultiSelectProps {
  label: string;
  menuItems: FilterOption[];
  selectedItem?: string[];
  setSelectedItem: (value: string[]) => void;
  valueKey: string;
  displayKey: string;
  backgroundColor?: string;
  textColor?: string;
}

export function VirtualizedMultiSelect({
  label,
  menuItems,
  selectedItem = [],
  setSelectedItem,
  valueKey,
  displayKey,
  backgroundColor,
  textColor,
}: VirtualizedMultiSelectProps) {
  const selectedOptions = React.useMemo(
    () =>
      menuItems.filter((item) => selectedItem.includes(String(item[valueKey]))),
    [menuItems, selectedItem, valueKey],
  );

  const hoverColor = safeAlpha(textColor, 0.08);
  const subtleColor = safeAlpha(textColor, 0.6) ?? textColor;

  // Estilos do campo (input, label, borda, chips e ícones)
  const inputSx = React.useMemo(
    () => ({
      "& .MuiOutlinedInput-root": {
        backgroundColor,
        color: textColor,
        "& .MuiOutlinedInput-notchedOutline": { borderColor: subtleColor },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: textColor },
      },
      "& .MuiInputLabel-root": { color: subtleColor },
      "& .MuiInputLabel-root.Mui-focused": { color: textColor },
      "& .MuiSvgIcon-root": { color: textColor }, // seta e botão de limpar
      "& .MuiChip-root": {
        color: textColor,
        backgroundColor: hoverColor,
        "& .MuiChip-deleteIcon": { color: subtleColor },
      },
      "& .MuiAutocomplete-tag": { color: textColor }, // texto "+N" do limitTags
    }),
    [backgroundColor, textColor, subtleColor, hoverColor],
  );

  // Estilos do menu (Paper + opções)
  const paperSx = React.useMemo(
    () => ({
      backgroundColor,
      color: textColor,
      "& .MuiAutocomplete-option.Mui-focused": { backgroundColor: hoverColor },
      "& .MuiAutocomplete-noOptions, & .MuiAutocomplete-loading": {
        color: subtleColor,
      },
      "& .MuiCheckbox-root": { color: subtleColor },
    }),
    [backgroundColor, textColor, subtleColor, hoverColor],
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      disableListWrap
      limitTags={2}
      size="small"
      options={menuItems}
      value={selectedOptions}
      isOptionEqualToValue={(opt, val) => opt[valueKey] === val[valueKey]}
      getOptionLabel={(opt) => String(opt[displayKey] ?? "")}
      onChange={(_, value) =>
        setSelectedItem(value.map((item) => String(item[valueKey])))
      }
      ListboxComponent={VirtualizedListbox}
      slotProps={{ paper: { sx: paperSx } }}
      renderInput={(params) => (
        <TextField {...params} label={label} sx={inputSx} />
      )}
      renderOption={(props, option, { selected }) => {
        const { key, ...optionProps } = props as any;
        return (
          <li key={option[valueKey]} {...optionProps}>
            <Checkbox size="small" checked={selected} sx={{ mr: 1 }} />
            {option[displayKey]}
          </li>
        );
      }}
    />
  );
}
