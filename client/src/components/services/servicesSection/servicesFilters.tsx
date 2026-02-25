"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
} from "@mui/material";
import { FunnelIcon } from "@heroicons/react/20/solid";

export interface FilterField<T> {
  label: string;
  field: keyof T;
  options: string[];
}

interface TableFilterProps<T> {
  data: T[];
  fields: FilterField<T>[];
  onFilter: (filteredData: T[]) => void;
}

export function TableFilter<T>({
  data,
  fields,
  onFilter,
}: TableFilterProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const applyFilter = () => {
    const filtered = data.filter((item) => {
      return fields.every((field) => {
        const filterValue = filters[field.field as string];

        if (!filterValue) return true;

        return item[field.field] === filterValue;
      });
    });

    onFilter(filtered);
  };

  const clearFilter = useCallback(() => {
    setFilters({});
    onFilter(data);
  }, [data, onFilter]);

  useEffect(() => {
    clearFilter();
  }, [clearFilter]);

  return (
    <Paper className="bg-gray-100 p-4 mb-4">
      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} md={4} key={String(field.field)}>
            <FormControl fullWidth size="small">
              <InputLabel>{field.label}</InputLabel>

              <Select
                value={filters[field.field as string] || ""}
                onChange={(e) =>
                  handleChange(String(field.field), e.target.value)
                }
              >
                <MenuItem value="">Selecionar...</MenuItem>

                {field.options.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        <Grid item xs={12} className="flex gap-2">
          <Button
            fullWidth
            variant="contained"
            className="bg-blue-600 text-white"
            onClick={applyFilter}
          >
            <FunnelIcon className="w-5 h-5 mr-1" />
            APLICAR
          </Button>

          <Button fullWidth variant="outlined" onClick={clearFilter}>
            LIMPAR
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
