import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";

interface AccordionPanelProps {
  id: string;
  title: string;
  expanded: string | false;
  onChange: (panel: string) => (event: any, isExpanded: boolean) => void;
  children: React.ReactNode;
}

export const AccordionPanel: React.FC<AccordionPanelProps> = ({
  id,
  title,
  expanded,
  onChange,
  children,
}) => (
  <Accordion expanded={expanded === id} onChange={onChange(id)}>
    <AccordionSummary>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h6">{title}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);
