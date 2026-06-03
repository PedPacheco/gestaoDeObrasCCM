// "use client";

// import { useRouter } from "next/navigation";
// import { useState } from "react";

// import { saveSchedule } from "@/actions/schedules";
// import { scheduleServices } from "@/actions/services";
// import { useFeedback } from "@/hooks/useFeedback";
// import { XMarkIcon } from "@heroicons/react/20/solid";
// import {
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
// } from "@mui/material";

// interface TeamModalProps {
//   open: boolean;
//   onClose: () => void;
//   teams: any[];
//   idSchedule: number | null;
//   selectedServices: any[];
//   scheduleData: any;
//   isInsert: boolean;
// }

// export function TeamModal({
//   open,
//   onClose,
//   teams,
//   idSchedule,
//   selectedServices,
//   scheduleData,
//   isInsert,
// }: TeamModalProps) {
//   const [idTeam, setIdTeam] = useState<any>("");

//   const router = useRouter();
//   const { showError, showSuccess } = useFeedback();

//   const handleServiceScheduling = async () => {
//     const formattedService = selectedServices.map((service) => ({
//       id: service.id,
//       idTeam,
//       idSchedule,
//       prog: service.prog,
//       additional: service.additional,
//     }));

//     let response;

//     if (isInsert) {
//       const data = {
//         schedule: scheduleData,
//         services: formattedService,
//       };

//       response = await saveSchedule(data);
//     } else {
//       response = await scheduleServices(scheduleData.idWork, formattedService);
//     }

//     if (!response.success) {
//       showError(response.error);
//       return;
//     }

//     showSuccess(response.message, () => router.refresh());
//     onClose();
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={onClose}
//       classes={{ paper: "rounded-xl shadow-2xl" }}
//     >
//       {/* HEADER */}
//       <div className="bg-[#e6f7fb] flex items-center justify-between px-4 py-2 border-b">
//         <DialogTitle className="p-0 text-sm font-semibold text-gray-700">
//           SERVIÇOS EQUIPES
//         </DialogTitle>

//         <button onClick={onClose} className="hover:opacity-70 p-1">
//           <XMarkIcon className="w-5 h-5 text-white" />
//         </button>
//       </div>

//       {/* BODY */}
//       <DialogContent className="p-6">
//         <FormControl fullWidth size="small">
//           <InputLabel className="text-gray-700">EQUIPE</InputLabel>
//           <Select
//             label="EQUIPE"
//             className="bg-white"
//             value={idTeam || ""}
//             onChange={(e) => setIdTeam(e.target.value)}
//           >
//             {teams.map((team, index) => (
//               <MenuItem key={index} value={team.id}>
//                 <div className="flex flex-col">
//                   <strong>{team.equipe}</strong>
//                   <small>Encarregado: {team.encarregado}</small>
//                   <small>Perfil: {team.perfil}</small>
//                 </div>
//               </MenuItem>
//             ))}
//           </Select>
//         </FormControl>
//       </DialogContent>

//       {/* FOOTER */}
//       <DialogActions className="px-6 pb-6">
//         <Button
//           fullWidth
//           variant="outlined"
//           className="border-gray-400 text-blue-700 font-semibold tracking-wide py-2 hover:bg-gray-50"
//           onClick={handleServiceScheduling}
//         >
//           CONFIRMAR
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// }

"use client";

import { useState } from "react";

import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

interface TeamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (idTeam: number | string) => void;
  teams: any[];
}

export function TeamModal({ open, onClose, onConfirm, teams }: TeamModalProps) {
  const [idTeam, setIdTeam] = useState<number | string>("");

  const handleConfirm = () => {
    if (!idTeam) return;
    onConfirm(idTeam);
    setIdTeam("");
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: "rounded-xl shadow-2xl" }}
    >
      <div className="bg-[#e6f7fb] flex items-center justify-between px-4 py-2 border-b">
        <DialogTitle className="p-0 text-sm font-semibold text-gray-700">
          SERVIÇOS EQUIPES
        </DialogTitle>
        <button onClick={onClose} className="hover:opacity-70 p-1">
          <XMarkIcon className="w-5 h-5 text-white" />
        </button>
      </div>

      <DialogContent className="p-6">
        <FormControl fullWidth size="small">
          <InputLabel className="text-gray-700">EQUIPE</InputLabel>
          <Select
            label="EQUIPE"
            className="bg-white"
            value={idTeam}
            onChange={(e) => setIdTeam(e.target.value)}
          >
            {teams.map((team, index) => (
              <MenuItem key={index} value={team.id}>
                <div className="flex flex-col">
                  <strong>{team.equipe}</strong>
                  <small>Encarregado: {team.encarregado}</small>
                  <small>Perfil: {team.perfil}</small>
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions className="px-6 pb-6">
        <Button
          fullWidth
          variant="outlined"
          className="border-gray-400 text-blue-700 font-semibold tracking-wide py-2 hover:bg-gray-50"
          onClick={handleConfirm}
          disabled={!idTeam}
        >
          CONFIRMAR
        </Button>
      </DialogActions>
    </Dialog>
  );
}
