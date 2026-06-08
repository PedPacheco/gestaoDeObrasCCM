import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useMemo, useState } from "react";
import { ChartTooltip } from "../common/ChartTooltip";
import { AderenciaRow, MotivoRow } from "./advancePartner";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Paper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface ModalObservacoesProps {
  open: boolean;
  motivo: string;
  registros: MotivoRow[];
  onClose: () => void;
}

function ModalObservacoes({
  open,
  motivo,
  registros,
  onClose,
}: ModalObservacoesProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      // FIX: fullScreen em mobile para melhor UX — modal ocupa tela inteira em sm
      fullScreen={false}
      fullWidth
      PaperProps={{
        sx: {
          background: "linear-gradient(135deg, #1e2f42, #192535)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: { xs: 2, md: 4 }, // FIX: border-radius menor em mobile
          maxHeight: "80vh",
          // FIX: margem lateral em mobile para não colar nas bordas
          mx: { xs: 2, sm: "auto" },
        },
      }}
    >
      {/* ── Header ── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          p: { xs: 2, md: 2.5 }, // FIX: padding menor em mobile
        }}
      >
        <Box flex={1} minWidth={0}>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: { xs: 12, md: 14 }, // FIX: fonte menor em mobile
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Observações de Execução
          </Typography>

          <Typography
            variant="caption"
            sx={{
              color: "#a1a1aa",
              mt: 0.5,
              wordBreak: "break-word",
              fontSize: { xs: 12, md: 14 },
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            Motivo:{" "}
            <Chip
              label={motivo}
              size="small"
              sx={{
                bgcolor: "rgba(29,78,216,0.25)",
                color: "#60a5fa",
                fontWeight: 600,
                fontSize: { xs: 11, md: 14 },
                height: 22,
                // FIX: texto do chip truncado para não estourar em mobile
                maxWidth: "100%",
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 200,
                },
              }}
            />
            {" — "}
            {registros.length} registro{registros.length !== 1 && "s"}
          </Typography>
        </Box>

        {/* FIX: botão de fechar no header (X) adicionado para UX mobile */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: "#71717a", mt: -0.5, mr: -0.5, flexShrink: 0 }}
        >
          <XCircleIcon className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* ── Body ── */}
      <DialogContent
        sx={{
          p: { xs: 1.5, md: 2.5 }, // FIX: padding menor em mobile
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {registros.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#71717a", textAlign: "center", py: 8 }}
          >
            Nenhuma observação registrada.
          </Typography>
        ) : (
          registros.map((r, i) => (
            <Paper
              key={`${r.ovnota}-${i}`}
              elevation={0}
              sx={{
                bgcolor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 3,
                p: { xs: 1.5, md: 2 }, // FIX: padding menor em mobile
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {/* OV/Nota */}
              <Typography
                variant="caption"
                sx={{ color: "#a1a1aa", fontSize: { xs: 12, md: 14 } }}
              >
                OV/Nota:{" "}
                <Box
                  component="span"
                  sx={{ color: "#e4e4e7", fontWeight: 500 }}
                >
                  {r.ovnota ?? "—"}
                </Box>
              </Typography>

              {/* Observação */}
              <Typography
                variant="body2"
                sx={{
                  color: "#d4d4d8",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: { xs: "0.8rem", md: "0.875rem" }, // FIX: fonte menor em mobile
                }}
              >
                {r.observacao_execucao?.trim()
                  ? r.observacao_execucao
                  : "Sem observação informada."}
              </Typography>
            </Paper>
          ))
        )}
      </DialogContent>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* ── Footer ── */}
      <DialogActions sx={{ px: { xs: 1.5, md: 2.5 }, py: 2 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="small"
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: "#2563eb",
            "&:hover": { bgcolor: "#3b82f6" },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface ChartReasonsReaschedulingProps {
  motivos: MotivoRow[];
  aderencia: AderenciaRow[];
  isPending: boolean;
}

export function ChartReasonsReascheduling({
  motivos,
  aderencia,
  isPending,
}: ChartReasonsReaschedulingProps) {
  const [selectedMotivo, setSelectedMotivo] = useState<string | null>(null);

  const totalWorks = useMemo(
    () => aderencia.reduce((s, r) => s + r.total, 0),
    [aderencia],
  );

  const motivosChartData = useMemo(() => {
    const counts: Record<
      string,
      {
        count: number;
        moNaoExecutada: number;
      }
    > = {};

    motivos.forEach((m) => {
      const k = (m.motivo || "Sem motivo informado").toUpperCase().trim();

      if (!counts[k]) {
        counts[k] = {
          count: 0,
          moNaoExecutada: 0,
        };
      }

      counts[k].count += 1;
      counts[k].moNaoExecutada += Number(m.mo_nao_executada ?? 0);
    });

    return Object.entries(counts)
      .map(([motivo, data]) => ({
        motivo,
        count: data.count,
        moNaoExecutada: data.moNaoExecutada,
        pct: totalWorks > 0 ? ((data.count / totalWorks) * 100).toFixed(2) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [motivos, totalWorks]);

  const registrosDoMotivo = useMemo(() => {
    if (!selectedMotivo) return [];
    return motivos.filter(
      (m) =>
        (m.motivo || "Sem motivo informado").toUpperCase().trim() ===
        selectedMotivo,
    );
  }, [motivos, selectedMotivo]);

  const handleBarClick = useCallback((data: any) => {
    if (data?.motivo) {
      setSelectedMotivo(data.motivo);
    }
  }, []);

  /*
    LÓGICA RESPONSIVA PARA O GRÁFICO:
    - Em mobile, labels e ticks das barras ficam ilegíveis
    - Solução: ajustar ângulo do XAxis, altura do container e fontSize por breakpoint
    - Usamos CSS classes para controlar a altura do gráfico via Tailwind
  */

  return (
    <>
      <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-4 sm:p-5 border border-white/5 shadow-xl">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide uppercase">
              Motivos de Reprogramação
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5">
              Top ocorrências por motivo
              {` — ${motivos.length} registros`}
            </p>
          </div>
          {/* FIX: hint de interatividade para mobile — usuário não sabe que pode clicar */}
          {motivosChartData.length > 0 && !isPending && (
            <span className="text-zinc-600 text-[10px] leading-tight text-right shrink-0">
              Clique em uma barra
              <br className="hidden sm:block" /> para ver detalhes
            </span>
          )}
        </div>

        {isPending ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
            Carregando…
          </div>
        ) : motivosChartData.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-sm text-center px-4">
            Nenhum motivo de reprogramação para o período e filtro selecionados.
          </div>
        ) : (
          /*
            FIX: altura do gráfico responsiva:
              mobile  → 300px (menos dados visíveis, XAxis mais alto para labels)
              tablet+ → 380px (altura original)
            O ResponsiveContainer já lida com largura.
          */
          <div className="h-[300px] sm:h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={motivosChartData}
                margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ffffff08"
                  vertical={false}
                />
                <XAxis
                  type="category"
                  dataKey="motivo"
                  tick={{
                    fill: "#94a3b8",
                    // FIX: fontSize menor em mobile para caber os labels
                    fontSize: 14,
                    angle: -30,
                    textAnchor: "end",
                  }}
                  tickFormatter={(v: string) =>
                    v.length > 18 ? v.slice(0, 18) + "…" : v
                  }
                  interval={0}
                  // FIX: altura maior para acomodar labels inclinados em mobile
                  height={100}
                />
                <YAxis
                  type="number"
                  tick={{ fill: "#94a3b8", fontSize: 14 }}
                  tickFormatter={(v) => `${v}%`}
                  // FIX: largura fixa para evitar que o YAxis "pule" ao carregar dados
                  width={40}
                />
                <Tooltip content={<ChartTooltip percentageFields={"pct"} />} />
                <Bar
                  className="hover:cursor-pointer"
                  dataKey={"pct"}
                  name={"% do total"}
                  fill="#1d4ed8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={72}
                  onClick={handleBarClick}
                  label={{
                    position: "top",
                    fill: "#94a3b8",
                    // FIX: label das barras menor em mobile para não sobrepor
                    fontSize: 14,
                    formatter: (v: any) => `${v}%`,
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {selectedMotivo && (
        <ModalObservacoes
          motivo={selectedMotivo}
          registros={registrosDoMotivo}
          onClose={() => setSelectedMotivo(null)}
          open={true}
        />
      )}
    </>
  );
}
