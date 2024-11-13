"use client";

import { Tab, Tabs } from "@mui/material";
import { Suspense, useEffect, useState } from "react";
import WorkCostPanelItem from "./panelItems/workCostPanelItem";
import AdditionalInformationPanelItem from "./panelItems/additionalInformationPanelItem";
import SchedulePanelItem from "./panelItems/schedulePanelItem";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className="overflow-y-auto h-full"
    >
      {value === index && children}
    </div>
  );
}

export default function TabPanel({ props }: Record<string, any>) {
  const [value, setValue] = useState(0);
  const [data, setData] = useState<Record<string, any>>(props);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  useEffect(() => {
    if (props) {
      setData(props);
    }
  }, [props]);

  return (
    <div className="w-fullflex justify-center items-start ">
      <div className="w-[95%] mx-auto mb-20 min-h-[530px] lg:min-h-0 lg:max-h-[620px] shadow-lg">
        <div className="border-b border-solid border-zinc-300">
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Custos" />
            <Tab label="Informações Adicionais" />
            <Tab label="Programações" />
            <Tab label="Serviços" />
          </Tabs>
        </div>

        <Suspense fallback={<p>carregando informações....</p>}>
          <CustomTabPanel value={value} index={0}>
            <WorkCostPanelItem data={data} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={1}>
            <AdditionalInformationPanelItem data={data} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={2}>
            <SchedulePanelItem data={data} />
          </CustomTabPanel>
          <CustomTabPanel value={value} index={3}>
            Item four
          </CustomTabPanel>
        </Suspense>
      </div>
    </div>
  );
}
