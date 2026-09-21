"use client";

import { useUser } from "@/contexts/userContext";

import { ReactNode, useEffect, useId, useState } from "react";
import { FormControl, MenuItem, Select, Tooltip } from "@mui/material";
import D5DataItem, { FieldShell } from "./dataItemD5";

export interface NoteD5EditableData {
  id_parceira: string;
  status: string;
  status_sap?: string;
}

interface EditableColumnD5Props {
  data: NoteD5EditableData;
  options: Record<string, any>;
  onHandleChange?: (field: keyof NoteD5EditableData, value: string) => void;
}

export interface SelectProps {
  label: string;
  menuItems: any[];
  selectedItem?: string | number;
  setSelectedItem?: (item: string) => void;
  valueKey?: string;
  displayKey?: string;
  disabled?: boolean;
  editButton?: ReactNode;
  placeholder?: string;
}

export function D5SelectComponent({
  label,
  menuItems = [],
  selectedItem,
  setSelectedItem,
  valueKey,
  displayKey,
  disabled,
  editButton,
  placeholder = "Selecione…",
}: SelectProps) {
  const [mounted, setMounted] = useState(false);
  const labelId = useId();

  useEffect(() => setMounted(true), []);

  const isDisabled = mounted ? Boolean(disabled) : false;
  const value = selectedItem ?? "";

  return (
    <FieldShell
      label={label}
      labelId={labelId}
      variant={isDisabled ? "read" : "edit"}
      trailing={
        editButton ? (
          <Tooltip title="Clique para alterar o motivo da suspensão">
            <span>{editButton}</span>
          </Tooltip>
        ) : null
      }
    >
      <FormControl fullWidth size="small">
        <Select
          value={value}
          displayEmpty
          aria-labelledby={labelId}
          disabled={isDisabled}
          onChange={(e) => setSelectedItem?.(String(e.target.value))}
          renderValue={(selected) => {
            if (selected === "" || selected === undefined) {
              return <span className="text-zinc-400">{placeholder}</span>;
            }
            const item = menuItems.find(
              (i) => String(valueKey ? i[valueKey] : i) === String(selected),
            );
            return (
              <span>
                {item ? (displayKey ? item[displayKey] : item) : selected}
              </span>
            );
          }}
          sx={{
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            "& .MuiSelect-select": {
              padding: "0 !important",
              paddingRight: "24px !important",
              minHeight: "unset !important",
              fontSize: "1rem",
              lineHeight: 1.4,
            },
            "& .MuiSelect-select.Mui-disabled": {
              opacity: 1,
              WebkitTextFillColor: "inherit",
              color: "#18181b",
            },
            "& .MuiSelect-icon": { right: 0, color: "#71717a" },
          }}
          MenuProps={{
            PaperProps: { style: { maxHeight: 360, marginTop: 4 } },
            MenuListProps: {
              dense: true,
              style: { overflowY: "auto", maxHeight: 360 },
            },
          }}
        >
          {menuItems.length === 0 && (
            <MenuItem disabled value="">
              Sem opções disponíveis
            </MenuItem>
          )}
          {menuItems.map((item, index) => {
            const v = valueKey ? item[valueKey] : item;
            const t = displayKey ? item[displayKey] : item;
            return (
              <MenuItem key={v ?? index} value={v}>
                {t}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </FieldShell>
  );
}

export const EditableColumnD5 = ({
  data,
  options,
  onHandleChange,
}: EditableColumnD5Props) => {
  const { permissions } = useUser();

  const isReadOnly =
    permissions?.tipo_usuario === "PARCEIRA" || !permissions?.permissao_edicao;

  return (
    <>
      <D5SelectComponent
        label="Parceira"
        menuItems={options.parceira}
        selectedItem={data.id_parceira}
        setSelectedItem={(value) => onHandleChange?.("id_parceira", value)}
        valueKey="id"
        displayKey="turma"
        disabled={isReadOnly}
      />

      <D5SelectComponent
        label="Status D5 (SIGO)"
        menuItems={options.status}
        selectedItem={data.status}
        setSelectedItem={(value) => onHandleChange?.("status", value)}
        valueKey="status"
        displayKey="status"
        disabled={isReadOnly}
      />

      <D5DataItem label="Status D5 (SAP)" value={data.status_sap} />
    </>
  );
};
