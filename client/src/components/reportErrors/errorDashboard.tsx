"use client";

import { useEffect, useState } from "react";

import { TabItem } from "@/app/(dashboard)/relatorio-erros/page";
import { useErrorsReportData } from "@/hooks/useErrorsReportData";
import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CalendarDateRangeIcon,
  DocumentIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import {
  AppBar,
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Drawer,
  IconButton,
} from "@mui/material";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { ButtonComponent } from "../common/Button";
import { ScheduleErrorTable } from "./tabs/scheduleErrorTable";
import { UndefinedItemsTable } from "./tabs/undefinedItemsTable";
import { WorksCapexValueZeroTable } from "./tabs/worksCapexValueZeroTable";
import { ExecutionDifferentialTable } from "./tabs/executionDifferentialTable";
import { DivergentConclusionTable } from "./tabs/divergentConclusionTable";
import { WorksWithoutYearPlanTable } from "./tabs/worksWithoutYearPlanTable";
import { RepeatedWorksTable } from "./tabs/repeatedWorksTable";

interface ErrorDashboardProps {
  undefinedItemsData: any[];
  scheduleErrorData: any[];
  zeroCapexData: any[];
  executionDifferentialData: any[];
  divergentConclusionData: any[];
  worksWithoutYearPlanData: any[];
  repeatedWorksData: any[];
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

const ENDPOINTS_CONFIG = [
  { key: "undefinedItems", path: "itens-nao-definidos" },
  { key: "scheduleError", path: "programacao" },
  { key: "zeroCapex", path: "valor-zero" },
  { key: "executionDifferential", path: "diferenca-executado" },
  { key: "divergentConclusion", path: "conclusao-divergente" },
  { key: "worksWithoutYearPlan", path: "ano-plan" },
  { key: "repeatedWorks", path: "obras-repetidas" },
];

export function ErrorDashboard({
  scheduleErrorData,
  undefinedItemsData,
  zeroCapexData,
  executionDifferentialData,
  divergentConclusionData,
  worksWithoutYearPlanData,
  repeatedWorksData,
  regionalValues,
  tabs,
  token,
}: ErrorDashboardProps) {
  const [selectedRegional, setSelectedRegional] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [tabsState, setTabsState] = useState<TabItem[]>(tabs);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const endpoints = ENDPOINTS_CONFIG.map(({ key, path }) => ({
    key,
    url: `${process.env.NEXT_PUBLIC_API_URL}/relatorio-erros/${path}`,
  }));

  const { state, fetchAll, isPending } = useErrorsReportData({
    token,
    endpoints,
    initialData: {
      undefinedItems: undefinedItemsData,
      scheduleError: scheduleErrorData,
      zeroCapex: zeroCapexData,
      executionDifferential: executionDifferentialData,
      divergentConclusion: divergentConclusionData,
      worksWithoutYearPlan: worksWithoutYearPlanData,
      repeatedWorks: repeatedWorksData,
    },
  });

  useEffect(() => {
    const dataMap: Record<string, any[]> = {
      "itens-nao-definido": state.undefinedItems.data,
      programacao: state.scheduleError.data,
      "valor-zero": state.zeroCapex.data,
      "diferenca-executado": state.executionDifferential.data,
      "conclusao-divergente": state.divergentConclusion.data,
      "ano-plan": state.worksWithoutYearPlan.data,
      "obras-repetidas": state.repeatedWorks.data,
    };

    const updated = tabsState.map((tab) => ({
      ...tab,
      count: dataMap[tab.id]?.length ?? 0,
    }));

    const hasChanged = updated.some((t, i) => t.count !== tabsState[i].count);

    if (hasChanged) setTabsState(updated);
  }, [
    state.undefinedItems.data,
    state.scheduleError.data,
    state.zeroCapex.data,
    state.executionDifferential.data,
    state.divergentConclusion.data,
    state.worksWithoutYearPlan.data,
    state.repeatedWorks.data,
    tabsState,
  ]);

  const handleApplyFilters = () => fetchAll({ idRegional: selectedRegional });
  const handleClearFilters = () => {
    setSelectedRegional("");
    fetchAll();
  };

  const tableComponents = [
    <UndefinedItemsTable
      key={0}
      undefinedItemsData={state.undefinedItems.data}
    />,
    <ScheduleErrorTable key={1} scheduleErrorData={state.scheduleError.data} />,
    <WorksCapexValueZeroTable
      key={2}
      worksCapexValueZeroData={state.zeroCapex.data}
    />,
    <ExecutionDifferentialTable
      key={3}
      executionDifferentialData={state.executionDifferential.data}
    />,
    <DivergentConclusionTable
      key={4}
      divergentConclusionData={state.divergentConclusion.data}
    />,
    <WorksWithoutYearPlanTable
      key={5}
      worksWithoutYearPlanData={state.worksWithoutYearPlan.data}
    />,
    <RepeatedWorksTable key={6} repeatedWorksData={state.repeatedWorks.data} />,
  ];

  const FiltersContent = () => (
    <div className="flex flex-col sm:flex-row gap-2 p-2 w-full">
      <FormControl className="min-w-full sm:min-w-[250px] w-full sm:w-auto">
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

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <ButtonComponent
          text="Filtrar"
          styled={isMobile ? "w-full mt-1" : "w-36 mt-1"}
          disabled={isPending}
          onClick={handleApplyFilters}
        />

        <ButtonComponent
          text="Limpar"
          styled={isMobile ? "w-full mt-1" : "w-36 mt-1"}
          disabled={isPending}
          onClick={handleClearFilters}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full sm:w-full md:w-[90%] lg:w-[80%] px-1 sm:px-2 md:px-0">
      <AppBar
        position="static"
        color="inherit"
        className="my-4 flex flex-col lg:flex-row lg:justify-between"
        elevation={1}
      >
        {isMobile ? (
          <>
            <div className="flex justify-between items-center p-2">
              <Typography variant="h6">Filtros</Typography>
              <IconButton onClick={() => setDrawerOpen(true)}>
                <Bars3Icon height={24} width={24} />
              </IconButton>
            </div>

            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <div className="w-[300px] p-2">
                <FiltersContent />
              </div>
            </Drawer>

            <div className="p-2 w-full">
              <ButtonComponent
                startIcon={<ArrowDownTrayIcon height={24} width={24} />}
                text="Exportar"
                styled="w-full"
                disabled={isPending}
              />
            </div>
          </>
        ) : (
          <>
            <FiltersContent />

            <div className="p-2 mt-1 w-full sm:w-full md:w-auto lg:w-[260px]">
              <ButtonComponent
                startIcon={<ArrowDownTrayIcon height={24} width={24} />}
                text="Exportar"
                styled="w-full"
                disabled={isPending}
              />
            </div>
          </>
        )}
      </AppBar>

      <Paper square elevation={0} className="bg-[#f9fafb]">
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabsState.map((tab, i) => {
            const Icon = iconsMap[tab.icon];
            return (
              <Tab
                key={i}
                className="min-w-[120px] sm:min-w-[160px] text-xs sm:text-sm p-2 sm:p-3"
                label={
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={isMobile ? 0.5 : 1}
                    alignItems="center"
                  >
                    <Icon
                      width={isMobile ? 24 : 32}
                      height={isMobile ? 24 : 32}
                    />
                    <Typography
                      variant="body2"
                      className={isMobile ? "text-[0.7rem]" : ""}
                    >
                      {tab.label}
                    </Typography>
                    <Chip size="small" label={tab.count} />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      <div className="bg-[#f9fafb] p-1 sm:p-2 md:p-3 overflow-x-auto">
        {tableComponents[activeTab]}
      </div>
    </div>
  );
}
