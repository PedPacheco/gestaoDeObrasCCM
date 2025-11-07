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
import { ScheduleErrorTable } from "./tabs/scheduleErrorTable";
import { useErrorsReportData } from "@/hooks/useErrorsReportData";

interface ErrorDashboardProps {
  undefinedItemsData: any[];
  scheduleErrorData: any[];
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
  scheduleErrorData,
  undefinedItemsData,
  regionalValues,
  tabs,
  token,
}: ErrorDashboardProps) {
  const [selectedRegional, setSelectedRegional] = useState("");
  const [activeTab, setActiveTab] = useState(0);

  const endpoints = [
    {
      key: "undefinedItems",
      url: `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/itens-nao-definidos`,
    },
    {
      key: "scheduleError",
      url: `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/programacao`,
    },
  ];

  const { state, fetchAll, isPending } = useErrorsReportData({
    token,
    endpoints,
    initialData: {
      undefinedItems: undefinedItemsData,
      scheduleError: scheduleErrorData,
    },
  });

  const handleApplyFilters = () => fetchAll({ idRegional: selectedRegional });
  const handleClearFilters = () => {
    setSelectedRegional("");
    fetchAll();
  };

  const renderTable = () => {
    switch (activeTab) {
      case 0:
        return (
          <UndefinedItemsTable undefinedItemsData={state.undefinedItems.data} />
        );

      case 1:
        return (
          <ScheduleErrorTable scheduleErrorData={state.scheduleError.data} />
        );
      default:
        return null;
    }
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
