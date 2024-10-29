"use client";

import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";

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
      className="overflow-y-auto p-3"
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

export default function TabPanel() {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="w-[95%] h-52 md:h-[90vh] mx-auto mb-24 shadow-lg flex flex-col">
      <div className="border-b border-solid border-zinc-300">
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="Item One" {...a11yProps(0)} />
          <Tab label="Item Two" {...a11yProps(1)} />
          <Tab label="Item Three" {...a11yProps(2)} />
        </Tabs>
      </div>
      {/* Container para os TabPanels */}

      <CustomTabPanel value={value} index={0}>
        Lorem ipsum dolor sit, amet consectetur adipisicing elit. Iste nesciunt
        explicabo suscipit. Dolorum quis debitis obcaecati architecto possimus
        modi molestias unde ratione, vel perferendis saepe minima aliquid iusto
        eum omnis? Lorem ipsum dolor sit, amet consectetur adipisicing elit.
        Iste nesciunt explicabo suscipit. Dolorum quis debitis obcaecati
        architecto possimus modi molestias unde ratione, vel perferendis saepe
        minima aliquid iusto eum omnis? Lorem ipsum dolor sit, amet consectetur
        adipisicing elit. Iste nesciunt explicabo suscipit. Dolorum quis debitis
        obcaecati architecto possimus modi molestias unde ratione, vel
        perferendis saepe minima aliquid iusto eum omnis? Lorem ipsum dolor sit,
        amet consectetur adipisicing elit. Iste nesciunt explicabo suscipit.
        Dolorum quis debitis obcaecati architecto possimus modi molestias unde
        ratione, vel perferendis saepe minima aliquid iusto eum omnis? Lorem
        ipsum dolor sit, amet consectetur adipisicing elit. Iste nesciunt
        explicabo suscipit. Dolorum quis debitis obcaecati architecto possimus
        modi molestias unde ratione, vel perferendis saepe minima aliquid iusto
        eum omnis?
      </CustomTabPanel>
      <CustomTabPanel value={value} index={1}>
        Item Two
      </CustomTabPanel>
      <CustomTabPanel value={value} index={2}>
        Item Three
      </CustomTabPanel>
    </div>
  );
}
