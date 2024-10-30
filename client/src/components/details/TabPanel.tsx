"use client";

import { Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";
import PanelItemLaborCosts from "./panelItems/panelItemLaborCosts";

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
      className="overflow-y-auto p-3 h-full"
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
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
      <div className="w-[95%] mx-auto mb-20 max-h-[530px] lg:max-h-[620px] xl:max-h-[85%] shadow-lg">
        <div className="border-b border-solid border-zinc-300">
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            <Tab label="Informações Adicionais" {...a11yProps(0)} />
            <Tab label="Programações" {...a11yProps(1)} />
            <Tab label="Serviços" {...a11yProps(2)} />
          </Tabs>
        </div>

        <CustomTabPanel value={value} index={0}>
          <PanelItemLaborCosts data={data} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          Item Two
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          Item Three
        </CustomTabPanel>
      </div>
    </div>
  );
}
