"use client";

import { useEffect, useState, Suspense, lazy } from "react";
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
  CircularProgress,
} from "@mui/material";
import { Bars3Icon } from "@heroicons/react/24/outline";

import { ButtonComponent } from "../common/Button";

// 🔥 Lazy loading das tabelas
const UndefinedItemsTable = lazy(() =>
  import("./tabs/undefinedItemsTable").then((m) => ({
    default: m.UndefinedItemsTable,
  }))
);
const ScheduleErrorTable = lazy(() =>
  import("./tabs/scheduleErrorTable").then((m) => ({
    default: m.ScheduleErrorTable,
  }))
);
const WorksCapexValueZeroTable = lazy(() =>
  import("./tabs/worksCapexValueZeroTable").then((m) => ({
    default: m.WorksCapexValueZeroTable,
  }))
);
const ExecutionDifferentialTable = lazy(() =>
  import("./tabs/executionDifferentialTable").then((m) => ({
    default: m.ExecutionDifferentialTable,
  }))
);
const DivergentConclusionTable = lazy(() =>
  import("./tabs/divergentConclusionTable").then((m) => ({
    default: m.DivergentConclusionTable,
  }))
);
const WorksWithoutYearPlanTable = lazy(() =>
  import("./tabs/worksWithoutYearPlanTable").then((m) => ({
    default: m.WorksWithoutYearPlanTable,
  }))
);
const RepeatedWorksTable = lazy(() =>
  import("./tabs/repeatedWorksTable").then((m) => ({
    default: m.RepeatedWorksTable,
  }))
);

const iconsMap = {
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  DocumentIcon,
  CalendarDateRangeIcon,
};

const ENDPOINTS_CONFIG = [
  {
    key: "undefinedItems",
    path: "itens-nao-definidos",
    label: "Itens Não Definidos",
    icon: "ExclamationCircleIcon" as const,
  },
  {
    key: "scheduleError",
    path: "programacao",
    label: "Programação <100%",
    icon: "ArrowTrendingUpIcon" as const,
  },
  {
    key: "zeroCapex",
    path: "valor-zero",
    label: "Valor Orçado Zero",
    icon: "ExclamationTriangleIcon" as const,
  },
  {
    key: "executionDifferential",
    path: "diferenca-executado",
    label: "Diferença Executado",
    icon: "DocumentIcon" as const,
  },
  {
    key: "divergentConclusion",
    path: "conclusao-divergente",
    label: "Data Conclusão Divergente",
    icon: "CalendarDateRangeIcon" as const,
  },
  {
    key: "worksWithoutYearPlan",
    path: "ano-plano",
    label: "Obras sem Ano Plano",
    icon: "ExclamationTriangleIcon" as const,
  },
  {
    key: "repeatedWorks",
    path: "obras-repetidas",
    label: "Obras Repetidas",
    icon: "ExclamationTriangleIcon" as const,
  },
];

interface ErrorDashboardProps {
  regionalValues: Record<string, string | number>[];
  token: string;
  initialParams?: any;
}

export function ErrorDashboard({
  regionalValues,
  token,
  initialParams,
}: ErrorDashboardProps) {
  const [selectedRegional, setSelectedRegional] = useState(
    initialParams?.idRegional || ""
  );
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ✅ Rastreia quais abas já foram carregadas
  const [loadedTabs, setLoadedTabs] = useState<Set<number>>(new Set());

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

  const { state, fetchSingle, fetchMultiple, isPending } = useErrorsReportData({
    token,
    endpoints,
    // ✅ NÃO passa initialData - tudo será carregado sob demanda
  });

  // ✅ Carrega primeira aba ao montar o componente
  useEffect(() => {
    const params = selectedRegional
      ? { idRegional: selectedRegional }
      : undefined;
    fetchSingle(0, params);
    setLoadedTabs(new Set([0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez

  // ✅ Carrega dados quando troca de aba (lazy loading)
  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);

    // Só carrega se ainda não foi carregada
    if (!loadedTabs.has(newValue)) {
      const params = selectedRegional
        ? { idRegional: selectedRegional }
        : undefined;
      fetchSingle(newValue, params);
      setLoadedTabs((prev) => new Set([...prev, newValue]));
    }
  };

  // ✅ Recarrega apenas as abas que já foram visualizadas
  const handleApplyFilters = () => {
    const params = selectedRegional
      ? { idRegional: selectedRegional }
      : undefined;
    const tabsToReload = Array.from(loadedTabs);
    fetchMultiple(tabsToReload, params);
  };

  const handleClearFilters = () => {
    setSelectedRegional("");
    const tabsToReload = Array.from(loadedTabs);
    fetchMultiple(tabsToReload, undefined);
  };

  // ✅ Gera tabs dinamicamente
  const tabs: TabItem[] = ENDPOINTS_CONFIG.map((config, index) => ({
    id: config.key,
    label: config.label,
    icon: config.icon,
    count: state[config.key]?.data?.length ?? 0,
  }));

  const FiltersContent = () => (
    <div className="flex flex-col sm:flex-row gap-2 p-2 w-full ">
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

  // ✅ Renderiza tabela com loading state
  const renderActiveTable = () => {
    const currentEndpoint = ENDPOINTS_CONFIG[activeTab];
    const tabData = state[currentEndpoint.key];

    // Mostra loading se a aba está carregando
    if (!tabData?.data && (isPending || tabData?.loading)) {
      return (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
          <span className="ml-2">Carregando dados...</span>
        </div>
      );
    }

    // Mostra erro se houver
    if (tabData?.error) {
      return (
        <div className="flex justify-center items-center h-64 text-red-500">
          <ExclamationCircleIcon className="w-6 h-6 mr-2" />
          <span>Erro: {tabData.error}</span>
        </div>
      );
    }

    const data = tabData?.data || [];

    switch (activeTab) {
      case 0:
        return <UndefinedItemsTable undefinedItemsData={data} />;
      case 1:
        return <ScheduleErrorTable scheduleErrorData={data} />;
      case 2:
        return <WorksCapexValueZeroTable worksCapexValueZeroData={data} />;
      case 3:
        return <ExecutionDifferentialTable executionDifferentialData={data} />;
      case 4:
        return <DivergentConclusionTable divergentConclusionData={data} />;
      case 5:
        return <WorksWithoutYearPlanTable worksWithoutYearPlanData={data} />;
      case 6:
        return <RepeatedWorksTable repeatedWorksData={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full overflow-y-auto mb-2 flex justify-center">
    <div className="sm:w-full md:w-[90%] lg:w-[80%] px-1 sm:px-2 md:px-0">
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
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {tabs.map((tab, i) => {
            const Icon = iconsMap[tab.icon];
            return (
              <Tab
                key={tab.id}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Icon height={18} width={18} />
                    <span>{tab.label}</span>
                    <Chip
                      label={tab.count}
                      size="small"
                      sx={{ ml: 1 }}
                      color="primary"
                    />
                  </Stack>
                }
              />
            );
          })}
        </Tabs>
      </Paper>

      <Box mt={2}>
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <CircularProgress />
            </div>
          }
        >
          {renderActiveTable()}
        </Suspense>
      </Box>
    </div>
    </div>
  );
}
