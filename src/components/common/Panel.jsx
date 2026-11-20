import { cn } from "@/lib/utils";

export function Panel({ className, children }) {
  return (
    <section className={cn("panel flex min-w-0 max-w-full flex-col", className)}>
      {children}
    </section>
  );
}

export function PanelHeader({ title, subtitle, icon, actions, className }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-4 pb-2 pt-3.5", className)}>
      {icon && <div className="hidden shrink-0 sm:block">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[14px] font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
