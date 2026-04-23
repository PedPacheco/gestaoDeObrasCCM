import { fetchData } from "@/actions/fetchData.action";
import { useState, useTransition } from "react";

interface EndpointConfig {
  key: string;
  url: string;
}

interface ErrorsReportDataState {
  [key: string]: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

interface UseErrorsReportDataProps {
  token: string;
  endpoints: EndpointConfig[];
  initialData?: Record<string, any[]>;
}

export function useErrorsReportData({
  token,
  endpoints,
  initialData = {},
}: UseErrorsReportDataProps) {
  const [isPending, startTransition] = useTransition();

  const [state, setState] = useState<ErrorsReportDataState>(() =>
    endpoints.reduce(
      (acc, ep) => ({
        ...acc,
        [ep.key]: {
          data: initialData[ep.key] ?? null, // null indica "não carregado ainda"
          loading: false,
          error: null,
        },
      }),
      {}
    )
  );

  // ✅ Fetch individual para carregar apenas uma aba
  const fetchSingle = async (index: number, params?: Record<string, any>) => {
    const endpoint = endpoints[index];
    if (!endpoint) return;

    startTransition(async () => {
      setState((prev) => ({
        ...prev,
        [endpoint.key]: {
          ...prev[endpoint.key],
          loading: true,
          error: null,
        },
      }));

      try {
        const result = await fetchData(endpoint.url, params, token, {
          cache: "no-store",
        });

        if (result.success) {
          setState((prev) => ({
            ...prev,
            [endpoint.key]: {
              data: result.data,
              loading: false,
              error: null,
            },
          }));
        } else {
          setState((prev) => ({
            ...prev,
            [endpoint.key]: {
              data: [],
              loading: false,
              error: result.message || "Erro ao carregar dados",
            },
          }));
        }
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          [endpoint.key]: {
            data: [],
            loading: false,
            error: error.message || "Erro desconhecido",
          },
        }));
      }
    });
  };

  // ✅ Fetch de todos (mantido para caso precise)
  const fetchAll = async (params?: Record<string, any>) => {
    startTransition(async () => {
      setState((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([k, v]) => [
            k,
            { ...v, loading: true, error: null },
          ])
        )
      );

      const results = await Promise.allSettled(
        endpoints.map((ep) =>
          fetchData(ep.url, params, token, { cache: "no-store" })
        )
      );

      const newState: ErrorsReportDataState = {};

      results.forEach((res, i) => {
        const key = endpoints[i].key;

        if (res.status === "fulfilled" && res.value.success) {
          newState[key] = {
            data: res.value.data,
            loading: false,
            error: null,
          };
        } else {
          newState[key] = {
            data: [],
            loading: false,
            error:
              res.status === "rejected"
                ? res.reason.message
                : res.value?.message || "Erro desconhecido",
          };
        }
      });

      setState((prev) => ({ ...prev, ...newState }));
    });
  };

  // ✅ Fetch múltiplo otimizado (carrega apenas abas específicas)
  const fetchMultiple = async (
    indices: number[],
    params?: Record<string, any>
  ) => {
    const endpointsToFetch = indices.map((i) => endpoints[i]).filter(Boolean);

    if (endpointsToFetch.length === 0) return;

    startTransition(async () => {
      // Marca apenas as abas sendo carregadas
      setState((prev) => {
        const updated = { ...prev };
        endpointsToFetch.forEach((ep) => {
          updated[ep.key] = {
            ...updated[ep.key],
            loading: true,
            error: null,
          };
        });
        return updated;
      });

      const results = await Promise.allSettled(
        endpointsToFetch.map((ep) =>
          fetchData(ep.url, params, token, { cache: "no-store" })
        )
      );

      setState((prev) => {
        const updated = { ...prev };

        results.forEach((res, i) => {
          const key = endpointsToFetch[i].key;

          if (res.status === "fulfilled" && res.value.success) {
            updated[key] = {
              data: res.value.data,
              loading: false,
              error: null,
            };
          } else {
            updated[key] = {
              data: [],
              loading: false,
              error:
                res.status === "rejected"
                  ? res.reason.message
                  : res.value?.message || "Erro desconhecido",
            };
          }
        });

        return updated;
      });
    });
  };

  return { state, fetchAll, fetchSingle, fetchMultiple, isPending };
}
