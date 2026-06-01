import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { Box, Card, Divider, Stack, Typography } from "@mui/material";

import { pctColor } from "../DashboardClient";
import { SparklineRow, SparkPoint } from "./advancePartner";
import Image from "next/image";

interface SparklinesSectionProps {
  semanasMap: Record<string, number>;
  sparklines: SparklineRow[];
  loading: boolean;
  filtersPartner: any;
}

function Sparkline({ data }: { data: SparkPoint[] }) {
  if (!data.length)
    return (
      <div className="h-[72px] flex items-center justify-center text-zinc-600 text-[10px]">
        —
      </div>
    );

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={4} fill={pctColor(payload.pct).text} />;
  };

  const CustomLabel = (props: any) => {
    const { x, y, value, index } = props;
    // Ajusta ancora p/ evitar corte nas bordas
    const anchor =
      index === 0 ? "start" : index === data.length - 1 ? "end" : "middle";
    return (
      <text
        x={x}
        y={y - 7}
        textAnchor={anchor}
        fontSize={12}
        fontWeight="700"
        fill={pctColor(value).text}
      >
        {value}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={72}>
      <LineChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="pct"
          stroke="#334155"
          strokeWidth={1.5}
          dot={<CustomDot />}
          label={<CustomLabel />}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SparklinesSection({
  filtersPartner,
  loading,
  semanasMap,
  sparklines,
}: SparklinesSectionProps) {
  const sparklinesFull = useMemo((): SparklineRow[] => {
    const withData = new Map(sparklines.map((s) => [s.parceira, s]));

    return (filtersPartner ?? [])
      .filter((p: any) => withData.has(p.turma))
      .map((p: any) => withData.get(p.turma))
      .filter(Boolean)
      .sort((a: SparklineRow, b: SparklineRow) =>
        a.parceira.localeCompare(b.parceira, "pt-BR"),
      );
  }, [sparklines, filtersPartner]);

  return (
    <div className="grid grid-cols-7 gap-2 px-5">
      {/* Card 1 — Empresas + Semanas */}
      <Card
        sx={{
          background: "linear-gradient(to bottom right, #1e2f42, #192535)",
          borderRadius: "16px",
          p: 2.5,
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
        className="col-span-1"
      >
        <Box mb={4}>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Empresas
          </Typography>

          <Typography
            sx={{
              color: "#71717a",
              fontSize: "0.75rem",
              mt: 0.5,
            }}
          >
            Semanas programadas
          </Typography>
        </Box>

        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Carregando…
            </Typography>
          </Box>
        ) : sparklinesFull.length === 0 ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Nenhum dado.
            </Typography>
          </Box>
        ) : (
          <Stack
            divider={
              <Divider
                sx={{
                  borderColor: "rgba(255,255,255,0.15)",
                  borderBottomWidth: "4px",
                }}
              />
            }
          >
            {sparklinesFull.map((row) => {
              const semanas = semanasMap[row.parceira] ?? null;

              const semDotColor =
                semanas === null
                  ? "#52525b" // cinza — sem dados
                  : semanas >= 8
                    ? "#10b981" // verde — 8 ou mais semanas
                    : semanas >= 6
                      ? "#eab308" // amarelo — 6 ou 7 semanas
                      : "#ef4444"; // vermelho — até 5 semanas

              return (
                <Box
                  key={row.parceira}
                  display="flex"
                  alignItems="center"
                  height={72}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Image
                      src={
                        ["START VALE", "START MCR"].includes(row.parceira)
                          ? "start-logo.png"
                          : `${row.parceira.toLowerCase()}-logo.png`
                      }
                      alt={`Logo ${row.parceira}`}
                      width={76}
                      height={60}
                    />

                    <Stack spacing={0.5} minWidth={0}>
                      <Typography
                        noWrap
                        sx={{
                          color: semDotColor,
                          fontWeight: 700,
                          fontSize: "0.9rem",
                          lineHeight: 1.2,
                        }}
                      >
                        {row.parceira}
                      </Typography>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "9999px",
                            flexShrink: 0,
                            background: semDotColor,
                          }}
                        />

                        <Typography
                          sx={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            lineHeight: 1,
                            color: semDotColor,
                          }}
                        >
                          {semanas !== null ? `${semanas} semanas` : "—"}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Card>

      {/* Card 2 — Eliminação de Restrições */}
      <Card
        sx={{
          background: "linear-gradient(to bottom right, #1e2f42, #192535)",
          borderRadius: "16px",
          p: 2.5,
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
        className="col-span-3"
      >
        <Box mb={4}>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Eliminação de Restrições
          </Typography>

          <Typography
            sx={{
              color: "#71717a",
              fontSize: "0.75rem",
              mt: 0.5,
            }}
          >
            Evolução semanal por empresa
          </Typography>
        </Box>

        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Carregando…
            </Typography>
          </Box>
        ) : sparklinesFull.length === 0 ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Nenhum dado encontrado.
            </Typography>
          </Box>
        ) : (
          <Stack
            divider={
              <Divider
                sx={{
                  borderColor: "rgba(255,255,255,0.15)",
                  borderBottomWidth: "4px",
                }}
              />
            }
          >
            {sparklinesFull.map((row) => (
              <Box
                key={row.parceira}
                display="flex"
                alignItems="center"
                height={72}
              >
                <Sparkline data={row.eliminacao} />
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      {/* Card 3 — Aderência à Programação */}
      <Card
        sx={{
          background: "linear-gradient(to bottom right, #1e2f42, #192535)",
          borderRadius: "16px",
          p: 2.5,
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow:
            "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        }}
        className="col-span-3"
      >
        <Box mb={4}>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.875rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Aderência à Programação
          </Typography>

          <Typography
            sx={{
              color: "#71717a",
              fontSize: "0.75rem",
              mt: 0.5,
            }}
          >
            Evolução semanal por empresa
          </Typography>
        </Box>

        {loading ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Carregando…
            </Typography>
          </Box>
        ) : sparklinesFull.length === 0 ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height={96}
          >
            <Typography sx={{ color: "#71717a", fontSize: "0.875rem" }}>
              Nenhum dado encontrado.
            </Typography>
          </Box>
        ) : (
          <Stack
            divider={
              <Divider
                sx={{
                  borderColor: "rgba(255,255,255,0.15)",
                  borderBottomWidth: "4px",
                }}
              />
            }
          >
            {sparklinesFull.map((row) => (
              <Box
                key={row.parceira}
                display="flex"
                alignItems="center"
                height={72}
              >
                <Sparkline data={row.aderencia} />
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </div>
  );
}
