"use client";

import { ReactNode, useEffect, useState } from "react";

import { FormControl, MenuItem } from "@mui/material";
import Select from "@mui/material/Select";

export interface SelectProps {
  label: string;
  menuItems: any[];
  selectedItem?: string;
  setSelectedItem?: (item: string) => void;
  valueKey?: string | number;
  displayKey?: string | number;
  disabled?: boolean;
}

type SelectItem = string | number;

export function SelectComponent({
  label,
  menuItems,
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
  disabled,
}: SelectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`flex items-center justify-between mb-3 max-w-96 w-[342px] h-10 border border-zinc-700 border-solid rounded-md ${
        !disabled && mounted ? "bg-white" : "bg-zinc-200"
      }`}
    >
      {label && (
        <p className="h-full flex items-center justify-start font-semibold w-40 p-2 text-center border-r border-zinc-700 border-solid">
          {label}
        </p>
      )}

      <FormControl
        className="flex-1 h-full min-w-32 lg:min-w-36 justify-center"
        size="small"
      >
        <Select
          value={selectedItem}
          displayEmpty
          className="text-center w-full h-full px-2"
          onChange={(e: { target: { value: string } }) =>
            setSelectedItem?.(e.target.value)
          }
          IconComponent={() => null}
          sx={{
            ".css-jedpe8-MuiSelect-select-MuiInputBase-input-MuiOutlinedInput-input.Mui-disabled":
              {
                opacity: 1,
                WebkitTextFillColor: "inherit",
              },
          }}
          inputProps={{
            className: `text-center text-sm p-2 pr-0 ${
              !disabled && mounted
                ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                : "text-black"
            }`,
          }}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 400 },
            },
            MenuListProps: {
              style: {
                overflowY: "auto",
                maxHeight: 400,
              },
            },
          }}
          disabled={mounted ? disabled : false}
        >
          {menuItems.map((item, index) => {
            const value = (valueKey ? item[valueKey] : item) as SelectItem;
            const label = (displayKey ? item[displayKey] : item) as ReactNode;
            return (
              <MenuItem key={index} value={value}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </div>
  );
}
