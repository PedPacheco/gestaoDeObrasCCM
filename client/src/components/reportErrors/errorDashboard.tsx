"use client";

import { useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { TabItem } from "@/app/(dashboard)/relatorio-erros/page";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CalendarDateRangeIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/20/solid";
import {
  AppBar,
  Box,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "../common/Button";
import { UndefinedItemsTable } from "./tabs/undefinedItemsTable";

interface ErrorDashboardProps {
  undefinedItemsData: any[];
  regionalValues: Record<string, string | number>[];
  tabs: TabItem[];
  token: string;
}

const iconsMap = {
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CalendarDateRangeIcon,
};

export function ErrorDashboard({
  undefinedItemsData,
  regionalValues,
  tabs,
  token,
}: ErrorDashboardProps) {
  const [selectedRegional, setSelectedRegional] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [isPending, startTransition] = useTransition();

  const [tableData, setTableData] = useState<any[]>(undefinedItemsData);

  const [error, setError] = useState<string | null>(null);

  const renderTable = () => {
    switch (activeTab) {
      case 0:
        return <UndefinedItemsTable undefinedItemsData={tableData} />;

      default:
        return null;
    }
  };

  const handleDataFetch = (url: string, params: any) => {
    startTransition(async () => {
      try {
        const response = await fetchData(url, params, token, {
          cache: "no-store",
        });

        if (!response.success) {
          setError(response.message);
          return;
        }

        setTableData(response.data);
      } catch (error: any) {
        setError(error.message);
      }
    });
  };

  const handleApplyFilters = () => {
    handleDataFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/itens-nao-definidos`,
      { idRegional: selectedRegional }
    );
  };

  const handleClearFilters = async () => {
    setSelectedRegional("");

    handleDataFetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/itens-nao-definidos`,
      undefined
    );
  };

  return (
    <Box sx={{ bgcolor: "#f9fafb", minHeight: "100vh" }}>
      <AppBar
        position="static"
        color="inherit"
        className="flex flex-row justify-between my-4"
        elevation={1}
      >
        <Box display="flex" gap={2} p={2}>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel>Regional</InputLabel>
            <Select
              value={selectedRegional}
              onChange={(e) => setSelectedRegional(e.target.value)}
              label="Regional"
            >
              {Object.entries(regionalValues).map(([index, opt]) => {
                return (
                  <MenuItem key={index} value={opt.id || ""}>
                    {opt.regional}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          <TextField
            label="Buscar OV"
            variant="outlined"
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MagnifyingGlassCircleIcon height={16} width={16} />
                </InputAdornment>
              ),
            }}
          />

          <ButtonComponent
            text="Filtrar"
            styled="w-36 mt-1"
            disabled={isPending}
            onClick={handleApplyFilters}
          />

          <ButtonComponent
            text="Limpar"
            styled="w-36 mt-1"
            disabled={isPending}
            onClick={handleClearFilters}
          />
        </Box>

        <Box p={2} marginTop={1} width={260}>
          <ButtonComponent
            startIcon={<ArrowDownTrayIcon height={24} width={24} />}
            text="Exportar"
            styled="w-full"
            disabled={isPending}
          />
        </Box>
      </AppBar>

      <Paper square elevation={0}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons
        >
          {tabs.map((tab, i) => {
            const Icon = iconsMap[tab.icon];
            return (
              <Tab
                key={i}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon width={32} height={32} />
                    <Typography variant="body2">{tab.label}</Typography>
                    <Chip size="small" label={tab.count} />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* CONTEÚDO */}
      <Box p={3}>{renderTable()}</Box>
    </Box>
  );
}
