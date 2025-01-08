import { LoadingComponent } from "@/components/common/Loading";

export function getButtonContent(isPending: boolean, defaultText: string) {
  return isPending ? <LoadingComponent color="text-white" /> : defaultText;
}
