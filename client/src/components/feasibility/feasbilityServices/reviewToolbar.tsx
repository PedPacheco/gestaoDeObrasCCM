import { ButtonComponent } from "@/components/common/Button";

interface ReviewToolbarProps {
  onFillPlanned: () => void;
  onDeleteAll: () => void;
}

export function ReviewToolbar({
  onFillPlanned,
  onDeleteAll,
}: ReviewToolbarProps) {
  return (
    <div className="mb-3 flex gap-2">
      <ButtonComponent
        text="Preencher com quantidade planejada"
        onClick={onFillPlanned}
      />

      <ButtonComponent text="Limpar importação" onClick={onDeleteAll} />
    </div>
  );
}
