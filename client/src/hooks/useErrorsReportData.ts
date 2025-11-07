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
  initialData: Record<string, any[]>;
}

export function useErrorsReportData({
  token,
  endpoints,
  initialData,
}: UseErrorsReportDataProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ErrorsReportDataState>(() =>
    endpoints.reduce(
      (acc, ep) => ({
        ...acc,
        [ep.key]: {
          data: initialData[ep.key] ?? [],
          loading: false,
          error: null,
        },
      }),
      {}
    )
  );

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

  return { state, fetchAll, isPending };
}
