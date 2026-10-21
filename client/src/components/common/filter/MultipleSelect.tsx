"use client";

import {
  FILTER_LIMIT_TAGS,
  filterRootProps,
  formatLabel,
  useFilterStyles,
} from "@/hooks/filters/useFiltersStyles";
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
} from "@mui/material";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import * as React from "react";

interface SelectProps<T> {
  label: string;
  menuItems: any[];
  selectedItem: T[];
  setSelectedItem: (items: T[]) => void;
  valueKey?: string;
  displayKey?: string;
  backgroundColor?: string;
  textColor?: string;
}

type SelectItem = string | number;

export function MultipleSelectComponent<T>({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
  backgroundColor,
  textColor,
}: SelectProps<T>) {
  const { fieldSx, paperSx } = useFilterStyles(backgroundColor, textColor);

  const labelId = `${label}-label`;
  const formattedLabel = formatLabel(label);
  const selectedValues = selectedItem ?? [];

  const getValue = React.useCallback(
    (item: any) => (valueKey ? item[valueKey] : item) as SelectItem,
    [valueKey],
  );
  const getDisplay = React.useCallback(
    (item: any) => (displayKey ? item[displayKey] : item) as SelectItem,
    [displayKey],
  );

  // Mapa valor -> texto, para os chips não terem de percorrer a lista a cada render
  const displayByValue = React.useMemo(
    () => new Map(menuItems.map((item) => [getValue(item), getDisplay(item)])),
    [menuItems, getValue, getDisplay],
  );

  const handleChange = (event: SelectChangeEvent<T[]>) => {
    const { value } = event.target;
    // Com autofill, o MUI pode devolver uma string separada por vírgulas
    setSelectedItem(
      (typeof value === "string" ? value.split(",") : value) as unknown as T[],
    );
  };

  return (
    <FormControl
      {...filterRootProps}
      sx={{ ...filterRootProps.sx, ...fieldSx }}
      size="small"
    >
      <InputLabel id={labelId}>{formattedLabel}</InputLabel>

      <Select<T[]>
        labelId={labelId}
        label={formattedLabel} // tem de ser igual ao InputLabel para o recorte da borda
        multiple
        value={selectedValues}
        onChange={handleChange}
        renderValue={(selected) => (
          <Box
            sx={{
              display: "flex",
              flexWrap: "nowrap",
              gap: 0.5,
              overflow: "hidden",
            }}
          >
            {selected.slice(0, FILTER_LIMIT_TAGS).map((val) => (
              <Chip
                key={String(val)}
                size="small"
                label={
                  displayByValue.get(val as unknown as SelectItem) ??
                  String(val)
                }
              />
            ))}
            {selected.length > FILTER_LIMIT_TAGS && (
              <Box
                component="span"
                sx={{ alignSelf: "center", fontSize: "0.8125rem" }}
              >
                +{selected.length - FILTER_LIMIT_TAGS}
              </Box>
            )}
          </Box>
        )}
        MenuProps={{ slotProps: { paper: { sx: paperSx } } }}
      >
        {menuItems.map((item) => {
          const value = getValue(item);
          return (
            <MenuItem key={String(value)} value={value}>
              <Checkbox
                size="small"
                checked={selectedValues.includes(value as unknown as T)}
                sx={{ mr: 1 }}
              />
              {getDisplay(item)}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}
