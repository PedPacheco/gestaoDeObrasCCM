import { CheckCircleIcon, PlusIcon } from "@heroicons/react/20/solid";
import { Tab, Tabs } from "@mui/material";
import { ClockIcon } from "@mui/x-date-pickers";
import { TabId } from "./editSchedule";
import { useUser } from "@/contexts/userContext";

interface TabConfig {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface TabsServicesProps {
  scheduledServicesLength: number;
  servicesDataLength: number;
  scheduledServicesHistoryLength: number;
  activeTab: TabId;
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>;
  isVisibleTab: boolean;
}

export function TabsServices({
  activeTab,
  setActiveTab,
  scheduledServicesHistoryLength,
  scheduledServicesLength,
  servicesDataLength,
  isVisibleTab,
}: TabsServicesProps) {
  const { permissions } = useUser();

  const tabs: TabConfig[] = [
    {
      id: "scheduled",
      label: "Serviços programados",
      icon: <CheckCircleIcon className="h-4 w-4" />,
      badge: scheduledServicesLength,
    },
    {
      id: "available",
      label: "Serviços disponíveis",
      icon: <PlusIcon className="h-4 w-4" />,
      badge: servicesDataLength,
    },
    {
      id: "history",
      label: "Histórico",
      icon: <ClockIcon className="h-4 w-4" />,
      badge: scheduledServicesHistoryLength,
    },
  ];

  const visibleTabs = !isVisibleTab
    ? tabs.filter((tab) => tab.id !== "available")
    : tabs;

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6">
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v as TabId)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 44,
          "& .MuiTab-root": {
            textTransform: "none",
            fontSize: 13,
            minHeight: 44,
            paddingX: 2,
            color: "#6b7280",
            fontWeight: 400,
          },
          "& .Mui-selected": {
            color: "#378ADD !important",
            fontWeight: 500,
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#378ADD",
            height: 2,
          },
        }}
      >
        {visibleTabs.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={
              <div className="flex items-center gap-1.5">
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      activeTab === tab.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
            }
          />
        ))}
      </Tabs>
    </div>
  );
}
