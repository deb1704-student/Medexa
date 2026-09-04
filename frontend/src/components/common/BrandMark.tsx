interface BrandMarkProps {
  showSubtitle?: boolean;
}

export function BrandMark({ showSubtitle = true }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
        <span className="material-symbols-outlined filled text-[24px]">
          medical_services
        </span>
      </div>

      <div>
        <div className="text-xl font-bold tracking-tight text-primary">
          Medexa
        </div>

        {showSubtitle && (
          <div className="text-xs font-medium text-on-surface-variant">
            Continuity of Care
          </div>
        )}
      </div>
    </div>
  );
}