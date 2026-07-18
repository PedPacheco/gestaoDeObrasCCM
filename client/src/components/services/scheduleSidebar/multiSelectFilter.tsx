import { CheckCircleIcon } from "@heroicons/react/20/solid";
import {
  Chip,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
} from "@mui/material";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  value: string[];
  placeholder: string;
  onChange: (e: SelectChangeEvent<string[]>) => void;
}

export function MultiSelectFilter({
  label,
  options,
  value,
  placeholder,
  onChange,
}: MultiSelectFilterProps) {
  const isActive = value.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      <label className="mb-1 text-[11px] text-gray-500">{label}</label>
      <Select
        multiple
        size="small"
        value={value}
        onChange={onChange}
        input={<OutlinedInput />}
        displayEmpty
        renderValue={(selected) =>
          selected.length === 0 ? (
            <span className="text-[12px] text-gray-400">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selected.map((v) => (
                <Chip
                  key={v}
                  label={v}
                  size="small"
                  sx={{ fontSize: 11, height: 20 }}
                />
              ))}
            </div>
          )
        }
        sx={{
          fontSize: 12,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: isActive ? "#378ADD" : undefined,
          },
        }}
      >
        {options.length === 0 ? (
          <MenuItem disabled>
            <span className="text-[12px] text-gray-400">
              Sem opções disponíveis
            </span>
          </MenuItem>
        ) : (
          options.map((option) => (
            <MenuItem key={option} value={option} sx={{ fontSize: 13 }}>
              <span
                className={`mr-2 flex h-4 w-4 items-center justify-center rounded border ${
                  value.includes(option)
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {value.includes(option) && (
                  <CheckCircleIcon className="h-3 w-3 text-white" />
                )}
              </span>
              {option}
            </MenuItem>
          ))
        )}
      </Select>
    </div>
  );
}
