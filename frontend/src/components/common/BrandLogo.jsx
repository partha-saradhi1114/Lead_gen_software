export function BrandLogo({
  size = "md",
  subtitle = true,
  light = false,
  className = "",
}) {
  const isSm = size === "sm";
  const isLg = size === "lg";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* LeadGen Pro Outreach & Target Radar Emblem */}
      <div
        className={`relative flex ${
          isSm
            ? "size-8 rounded-lg"
            : isLg
              ? "size-11 rounded-xl"
              : "size-9 rounded-lg"
        } shrink-0 items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-sm shadow-blue-500/25 ring-1 ring-white/20`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            isSm
              ? "size-4 text-white"
              : isLg
                ? "size-6 text-white"
                : "size-5 text-white"
          }
        >
          {/* Target radar rings */}
          <circle
            cx="12"
            cy="12"
            r="9"
            className="opacity-35"
            strokeDasharray="2 2"
          />
          <circle cx="12" cy="12" r="5" className="opacity-80" />
          {/* Crosshair compass points */}
          <line x1="12" y1="2" x2="12" y2="5" />
          <line x1="12" y1="19" x2="12" y2="22" />
          <line x1="2" y1="12" x2="5" y2="12" />
          <line x1="19" y1="12" x2="22" y2="12" />
          {/* Inner center bullseye core */}
          <circle cx="12" cy="12" r="2" className="fill-white" />
        </svg>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-bold tracking-tight ${
              light ? "text-white" : "text-foreground"
            } ${isLg ? "text-xl" : isSm ? "text-sm" : "text-[16px]"}`}
          >
            LeadGen{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent font-extrabold">
              Pro
            </span>
          </span>
        </div>

        {subtitle && (
          <div
            className={`truncate leading-tight ${
              light ? "text-slate-400" : "text-muted-foreground"
            } ${isSm ? "text-[10px]" : "text-[11px]"}`}
          >
            Enterprise Lead Operations
          </div>
        )}
      </div>
    </div>
  );
}
