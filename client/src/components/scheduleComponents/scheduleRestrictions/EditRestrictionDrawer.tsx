// "use client";

// import dayjs from "dayjs";
// import { useEffect, useState } from "react";

// import {
//   Box,
//   Button,
//   Divider,
//   Drawer,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   TextField,
//   Typography,
// } from "@mui/material";
// import { DatePicker } from "@mui/x-date-pickers";
// import "dayjs/locale/pt-br";
// import { transformRestrictions } from "@/utils/transform";

// interface EditRestrictionDrawerProps {
//   open: boolean;
//   onClose: () => void;
//   data: any | null;
//   onSave: (updated: any) => void;
//   restrictionsValues: any[];
// }

// export const INITIAL_FORM_DATA = {
//   id: 1,
//   idRestriction1: 1,
//   responsibility1: "",
//   responsiblePerson1: "",
//   responsibleArea1: "",
//   restrictionStatus1: "",
//   resolutionDate1: new Date(),
//   idRestriction2: 1,
//   responsibility2: "",
//   responsiblePerson2: "",
//   responsibleArea2: "",
//   restrictionStatus2: "",
//   resolutionDate2: new Date(),
// };

// export default function EditRestrictionDrawer({
//   open,
//   onClose,
//   data,
//   onSave,
//   restrictionsValues,
// }: EditRestrictionDrawerProps) {
//   const [form, setForm] = useState(INITIAL_FORM_DATA);

//   useEffect(() => {
//     if (data) {
//       const formattedData = transformRestrictions(data);

//       setForm(formattedData);
//     }
//   }, [data]);

//   const handleChange = (field: string, value: any) => {
//     setForm((prev: any) => ({ ...prev, [field]: value }));
//   };

//   const handleSave = () => {
//     onSave(form);
//     onClose();
//   };

//   return (
//     <Drawer anchor="right" open={open} onClose={onClose}>
//       <Box sx={{ width: 420, p: 3 }}>
//         <Typography variant="h5" fontWeight="bold" mb={2}>
//           Editar Restrição
//         </Typography>

//         <Divider />

//         {/* === BLOCO 1 === */}
//         <Typography variant="h6" mt={2}>
//           1ª Restrição
//         </Typography>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>1° Restrição</InputLabel>
//           <Select
//             value={form.idRestriction1 || 1}
//             onChange={(e) => handleChange("idRestriction1", e.target.value)}
//             label="1° Restrição"
//           >
//             {restrictionsValues.map((value, index) => (
//               <MenuItem key={index} value={value.id}>
//                 {value.restricao}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>1° Responsabilidade</InputLabel>
//           <Select
//             value={form.responsibility1 || ""}
//             onChange={(e) => handleChange("responsibility1", e.target.value)}
//             label="1° Responsabilidade"
//           >
//             <MenuItem className="p-4" value=""></MenuItem>
//             <MenuItem value="Edp">Edp</MenuItem>
//             <MenuItem value="Parceira">Parceira</MenuItem>
//           </Select>
//         </FormControl>

//         <TextField
//           fullWidth
//           label="1° Nome do responsável"
//           value={form.responsiblePerson1 || ""}
//           onChange={(e) => handleChange("responsiblePerson1", e.target.value)}
//           margin="normal"
//         />

//         <TextField
//           fullWidth
//           label="1° Área do responsável"
//           value={form.responsibleArea1 || ""}
//           onChange={(e) => handleChange("responsibleArea1", e.target.value)}
//           margin="normal"
//         />

//         <FormControl fullWidth margin="normal">
//           <InputLabel>1° Status da restrição</InputLabel>
//           <Select
//             value={form.restrictionStatus1 || ""}
//             onChange={(e) => handleChange("restrictionStatus1", e.target.value)}
//             label="1° Status da restrição"
//           >
//             <MenuItem className="p-4" value=""></MenuItem>
//             <MenuItem value="Pendente">Pendente</MenuItem>
//             <MenuItem value="Resolvido">Resolvido</MenuItem>
//             <MenuItem value="Em análise">Em análise</MenuItem>
//           </Select>
//         </FormControl>

//         <DatePicker
//           label="1° Data de resolução"
//           value={form.resolutionDate1 ? dayjs(form.resolutionDate1) : null}
//           onChange={(v) =>
//             handleChange("resolutionDate1", v ? v.toISOString() : null)
//           }
//           className="mt-4 mb-2"
//         />

//         {/* === BLOCO 2 === */}
//         <Typography variant="h6" mt={4}>
//           2ª Restrição
//         </Typography>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>2° Restrição</InputLabel>
//           <Select
//             value={form.idRestriction2 || 1}
//             onChange={(e) => handleChange("idRestriction2", e.target.value)}
//             label="2° Restrição"
//           >
//             {restrictionsValues.map((value, index) => (
//               <MenuItem key={index} value={value.id}>
//                 {value.restricao}
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>

//         <FormControl fullWidth margin="normal">
//           <InputLabel>2° Responsabilidade</InputLabel>
//           <Select
//             value={form.responsibility2 || ""}
//             onChange={(e) => handleChange("responsibility2", e.target.value)}
//             label="2° Responsabilidade"
//           >
//             <MenuItem className="p-4" value=""></MenuItem>
//             <MenuItem value="Edp">Edp</MenuItem>
//             <MenuItem value="Parceira">Parceira</MenuItem>
//           </Select>
//         </FormControl>

//         <TextField
//           fullWidth
//           label="2° Nome do responsável"
//           value={form.responsiblePerson2 || ""}
//           onChange={(e) => handleChange("responsiblePerson2", e.target.value)}
//           margin="normal"
//         />

//         <TextField
//           fullWidth
//           label="2° Área do responsável"
//           value={form.responsibleArea2 || ""}
//           onChange={(e) => handleChange("responsibleArea2", e.target.value)}
//           margin="normal"
//         />

//         <FormControl fullWidth margin="normal">
//           <InputLabel>2° Status da restrição</InputLabel>
//           <Select
//             value={form.restrictionStatus2 || ""}
//             onChange={(e) => handleChange("restrictionStatus2", e.target.value)}
//             label="2° Status da restrição"
//           >
//             <MenuItem className="p-4" value=""></MenuItem>
//             <MenuItem value="Pendente">Pendente</MenuItem>
//             <MenuItem value="Resolvido">Resolvido</MenuItem>
//             <MenuItem value="Em análise">Em análise</MenuItem>
//           </Select>
//         </FormControl>

//         <DatePicker
//           label="2° Data de resolução"
//           value={form.resolutionDate2 ? dayjs(form.resolutionDate2) : null}
//           onChange={(v) =>
//             handleChange("resolutionDate2", v ? v.toISOString() : null)
//           }
//           className="mt-4 mb-2"
//         />

//         <Button
//           variant="contained"
//           fullWidth
//           sx={{ mt: 4 }}
//           onClick={handleSave}
//         >
//           Salvar Alterações
//         </Button>
//       </Box>
//     </Drawer>
//   );
// }
