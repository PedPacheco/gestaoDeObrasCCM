import Image from "next/image";
import { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";

import { Box, Card, Divider, Stack, Typography } from "@mui/material";

import {
  pctColorGripSchedule,
  pctColorRestrictionsElimination,
} from "./advancePartner";

interface SparkPoint {
  semana: string;
  pct: number;
}

export interface SparklineRow {
  parceira: string;
  aderencia: SparkPoint[];
  eliminacao: SparkPoint[];
}

interface SparklinesSectionProps {
  semanasMap: Record<string, number>;
  sparklines: SparklineRow[];
  loading: boolean;
  filtersPartner: any;
}

function Sparkline({
  data,
  pctColor,
}: {
  data: SparkPoint[];
  pctColor: (pct: number) => any;
}) {
  if (!data.length)
    return (
      <div className="h-[72px] flex items-center justify-center text-zinc-600 text-[14px]">
        —
      </div>
    );

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    return <circle cx={cx} cy={cy} r={5} fill={pctColor(payload.pct).text} />;
  };

  const CustomLabel = (props: any) => {
    const { x, y, value, index } = props;
    const anchor =
      index === 0 ? "start" : index === data.length - 1 ? "end" : "middle";
    return (
      <text
        x={x}
        y={y - 7}
        textAnchor={anchor}
        fontSize={14}
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

function SparklineCard({
  title,
  subtitle,
  secondSubtitle,
  loading,
  rows,
  dataKey,
  colSpan,
}: {
  title: string;
  subtitle: string;
  secondSubtitle: string;
  loading: boolean;
  rows: SparklineRow[];
  dataKey: "eliminacao" | "aderencia";
  colSpan?: string;
}) {
  const cardSx = {
    background: "linear-gradient(to bottom right, #1e2f42, #192535)",
    borderRadius: "16px",
    p: 2.5,
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  };

  return (
    <Card sx={cardSx} className={colSpan}>
      <Box mb={4}>
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>
        <Typography sx={{ color: "#71717a", fontSize: "0.9rem", mt: 0.5 }}>
          {subtitle}
        </Typography>
        <Typography
          sx={{
            color: "#53FF75", // usa o verde do tema
            fontSize: "0.9rem",
            fontWeight: 700,
            mt: 0.5,
          }}
        >
          {secondSubtitle}
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
      ) : rows.length === 0 ? (
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
          {rows.map((row) => (
            <Box
              key={row.parceira}
              display="flex"
              alignItems="center"
              height={72}
            >
              <Sparkline
                data={row[dataKey]}
                pctColor={
                  dataKey === "aderencia"
                    ? pctColorGripSchedule
                    : pctColorRestrictionsElimination
                }
              />
            </Box>
          ))}
        </Stack>
      )}
    </Card>
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

  const cardSx = {
    background: "linear-gradient(to bottom right, #1e2f42, #192535)",
    borderRadius: "16px",
    p: 2.5,
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow:
      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  };

  return (
    /*
      ANTES: grid-cols-7 fixo (1 + 3 + 3) — em tablets/mobile os cards ficavam
             ilegíveis pois o grid dividia igualmente os 7fr sem responsividade.
      AGORA: layout em 3 fases:
        mobile (<768px)   → 1 coluna: todos os 3 cards empilhados
        tablet (md)       → 2 colunas: card de empresas ocupa linha toda,
                            Eliminação e Aderência lado a lado (1+1)
        desktop (xl+)     → 7 colunas: layout original (1 + 3 + 3)
      padding lateral padronizado: px-4 sm:px-5 (consistente com KpiSection)
    */
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-2 sm:gap-3 px-4 sm:px-5">
      {/* Card 1 — Empresas + Semanas */}
      {/* FIX: md:col-span-2 para ocupar linha completa no tablet, xl:col-span-1 para voltar ao slot original */}
      <Card sx={cardSx} className="md:col-span-2 xl:col-span-1">
        <Box mb={4}>
          <Typography
            sx={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Empresas
          </Typography>
          <Typography sx={{ color: "#71717a", fontSize: "0.9rem", mt: 0.5 }}>
            Semanas programadas
          </Typography>
          <Typography
            sx={{
              color: "#53FF75",
              fontWeight: 700,
              fontSize: "0.9rem",
              mt: 0.5,
            }}
          >
            Meta: 8 semanas
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
          /*
            FIX: no tablet (md:col-span-2), o card de empresas fica largo demais
            para uma lista vertical. Aplicamos grid de 2 colunas no md para
            aproveitar o espaço horizontal disponível.
          */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-0">
            {sparklinesFull.map((row, i) => {
              const semanas = semanasMap[row.parceira] ?? null;

              const semDotColor =
                semanas >= 8 ? "#53FF75" : semanas >= 6 ? "#eab308" : "#ef4444";

              const isLastOdd =
                sparklinesFull.length % 2 !== 0 &&
                i === sparklinesFull.length - 1;

              return (
                <div key={row.parceira}>
                  {/* Divider: só visível quando em coluna única (mobile e xl) */}
                  {i > 0 && (
                    <div
                      className={`border-t border-white/15 ${isLastOdd ? "md:hidden xl:block" : ""}`}
                      style={{ borderBottomWidth: "4px" }}
                    />
                  )}
                  <Box
                    display="flex"
                    alignItems="center"
                    height={72}
                    // FIX: padding lateral no tablet para separar visualmente os itens em grid
                    px={{ xs: 0, md: 1, xl: 0 }}
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
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Card 2 — Eliminação de Restrições */}
      {/* FIX: col-span-1 no md (metade da tela), xl:col-span-3 para layout original */}
      <SparklineCard
        title="Eliminação de Restrições"
        subtitle="Evolução semanal por empresa"
        secondSubtitle="Meta: 100%"
        loading={loading}
        rows={sparklinesFull}
        dataKey="eliminacao"
        colSpan="xl:col-span-3"
      />

      {/* Card 3 — Aderência à Programação */}
      {/* FIX: col-span-1 no md (metade da tela), xl:col-span-3 para layout original */}
      <SparklineCard
        title="Aderência à Programação"
        subtitle="Evolução semanal por empresa"
        secondSubtitle="Meta: 85%"
        loading={loading}
        rows={sparklinesFull}
        dataKey="aderencia"
        colSpan="xl:col-span-3"
      />
    </div>
  );
}
