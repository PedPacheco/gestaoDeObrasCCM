import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Slider,
  FormHelperText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { validationSchedulesSchema } from "@/validations/validationSchedules";
import { z } from "zod";
import { saveSchedule } from "@/actions/schedules";

interface ScheduleFormDialogProps {
  open: boolean;
  onClose: () => void;
  idWork: number;
  IsInsert: boolean;
  setError: (error: string) => void;
  setSuccess: (success: string) => void;
  setOpenModal: (open: boolean) => void;
}

type FormData = z.infer<typeof validationSchedulesSchema>;

const initialFormData: FormData = {
  dataProg: new Date().toISOString().split("T")[0],
  startTime: "08:00",
  finishTime: "17:00",
  prog: 0,
  exec: undefined,
  serviceType: "",
  equipment: undefined,
  chi: 0,
  numDp: undefined,
  temporaryKey: false,
  lmTeam: 0,
  regulTeam: 0,
  lvTeam: 0,
  idTechnical: 1,
  idExecutionRestriction: 1,
  responsibilityExecution: undefined,
  observationExecution: undefined,
};

const serviceTypes = [
  "LV",
  "DP",
  "Obra livre",
  "DP + LV",
  "LV + Obra livre",
  "Regularização",
  "Desativação RD",
];

export default function ScheduleFormDialog({
  open,
  onClose,
  idWork,
  setError,
  IsInsert,
  setOpenModal,
  setSuccess,
}: ScheduleFormDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | false>("panel1");
  const [isPending, startTransition] = useTransition();

  const handleAccordionChange =
    (panel: string) => (_: any, isExpanded: boolean) =>
      setExpanded(isExpanded ? panel : false);

  const handleInputChange =
    (field: keyof FormData) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
    ) => {
      const value = event.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: [
          "prog",
          "exec",
          "chi",
          "lmTeam",
          "regulTeam",
          "lvTeam",
          "idTechnical",
          "idExecutionRestriction",
        ].includes(field)
          ? Number(value)
          : value,
      }));
    };

  const handleSliderChange =
    (field: "prog" | "exec") => (_: Event, newValue: number | number[]) =>
      setFormData((prev) => ({
        ...prev,
        [field]: newValue as number,
      }));

  const handleClose = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setExpanded("panel1");
    onClose();
  };

  function handleClick() {
    startTransition(async () => {
      try {
        const result = validationSchedulesSchema.safeParse(formData);

        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err: any) => {
            const field = err.path[0] as string;
            fieldErrors[field] = err.message;
          });
          setFormErrors(fieldErrors);
          return;
        }

        const validatedData = { idWork, ...result.data };

        if (IsInsert) {
          const res = await saveSchedule(validatedData);

          if (!res.success) {
            setError(res.error);
            return;
          }

          setSuccess(res.message);

          handleClose();
          setOpenModal(true);
        } else {
          console.log("Atualizando programação", validatedData);
        }
      } catch (error: any) {
        setError(error.message);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          minHeight: "600px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {IsInsert ? "Nova Programação" : "Editar Programação"}
          </Typography>
          <IconButton onClick={handleClose}></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Accordion
          expanded={expanded === "panel1"}
          onChange={handleAccordionChange("panel1")}
        >
          <AccordionSummary>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">Informações Básicas</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Data da Programação"
                  type="date"
                  value={formData.dataProg}
                  onChange={handleInputChange("dataProg")}
                  error={!!formErrors.dataProg}
                  helperText={formErrors.dataProg}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Horário Início"
                  type="time"
                  value={formData.startTime}
                  onChange={handleInputChange("startTime")}
                  error={!!formErrors.startTime}
                  helperText={formErrors.startTime}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Horário Fim"
                  type="time"
                  value={formData.finishTime}
                  onChange={handleInputChange("finishTime")}
                  error={!!formErrors.finishTime}
                  helperText={formErrors.finishTime}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={formData.exec !== undefined ? 6 : 12}>
                <Typography gutterBottom>
                  Progresso Programado: {formData.prog}%
                </Typography>
                <Slider
                  value={formData.prog}
                  onChange={handleSliderChange("prog")}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  marks={[
                    { value: 0, label: "0" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" },
                  ]}
                />
                {formErrors.prog && (
                  <FormHelperText error>{formErrors.prog}</FormHelperText>
                )}
              </Grid>

              {!IsInsert && (
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Progresso Executado: {formData.exec}%
                  </Typography>
                  <Slider
                    value={formData.exec}
                    onChange={handleSliderChange("exec")}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                  />
                  {formErrors.exec && (
                    <FormHelperText error>{formErrors.exec}</FormHelperText>
                  )}
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Seção 2: Serviço e Equipamentos */}
        <Accordion
          expanded={expanded === "panel2"}
          onChange={handleAccordionChange("panel2")}
        >
          <AccordionSummary>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">Serviço e Equipamentos</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Serviço</InputLabel>
                  <Select
                    value={formData.serviceType}
                    onChange={handleInputChange("serviceType")}
                    label="Tipo de Serviço"
                  >
                    {serviceTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Equipamento a ser desligado"
                  value={formData.equipment}
                  onChange={handleInputChange("equipment")}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CHI"
                  value={formData.chi}
                  onChange={handleInputChange("chi")}
                  error={!!formErrors.chi}
                  helperText={formErrors.chi}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Número DP"
                  value={formData.numDp}
                  onChange={handleInputChange("numDp")}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expanded === "panel3"}
          onChange={handleAccordionChange("panel3")}
        >
          <AccordionSummary>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">Equipes</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Equipe LM"
                  value={formData.lmTeam}
                  error={!!formErrors.lmTeam}
                  helperText={formErrors.lmTeam}
                  onChange={handleInputChange("lmTeam")}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Equipe Regular"
                  value={formData.regulTeam}
                  error={!!formErrors.regulTeam}
                  helperText={formErrors.regulTeam}
                  onChange={handleInputChange("regulTeam")}
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Equipe LV"
                  value={formData.lvTeam}
                  error={!!formErrors.lvTeam}
                  helperText={formErrors.lvTeam}
                  onChange={handleInputChange("lvTeam")}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {!IsInsert && (
          <Accordion
            expanded={expanded === "panel4"}
            onChange={handleAccordionChange("panel4")}
          >
            <AccordionSummary>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6">Informações Adicionais</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Técnico Responsável</InputLabel>
                    <Select
                      value={formData.idTechnical}
                      onChange={handleInputChange("idTechnical")}
                      label="Técnico Responsável"
                    >
                      {/* {technicalOptions.map((tech) => (
                    <MenuItem key={tech.id} value={tech.id}>
                      {tech.name}
                    </MenuItem>
                  ))} */}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Restrição de Execução</InputLabel>
                    <Select
                      value={formData.idExecutionRestriction}
                      onChange={handleInputChange("idExecutionRestriction")}
                      label="Restrição de Execução"
                    >
                      {/* {executionRestrictions.map((restriction) => (
                    <MenuItem key={restriction.id} value={restriction.id}>
                      {restriction.name}
                    </MenuItem>
                  ))} */}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Responsabilidade de Execução"
                    value={formData.responsibilityExecution}
                    onChange={handleInputChange("responsibilityExecution")}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Observações de Execução"
                    value={formData.observationExecution}
                    onChange={handleInputChange("observationExecution")}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary">
          Cancelar
        </Button>
        <Button color="primary" variant="contained" onClick={handleClick}>
          {isPending ? "Salvando..." : "Salvar Programação"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
