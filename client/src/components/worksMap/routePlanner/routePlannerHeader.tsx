interface Props {
  onClose: () => void;
}

export function RoutePlannerHeader({ onClose }: Props) {
  return (
    <div className="bg-[#212E3E] px-4 py-3 flex items-center justify-between shrink-0">
      <span className="text-white font-semibold text-sm">
        Planejador de rota
      </span>
      <button
        onClick={onClose}
        aria-label="Fechar planejador de rota"
        className="text-zinc-400 hover:text-white text-lg leading-none"
      >
        ✕
      </button>
    </div>
  );
}
