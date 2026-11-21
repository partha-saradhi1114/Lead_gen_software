import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Toolbar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-4 pb-2.5">
      {children}
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-52 pl-8 text-xs md:text-xs"
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterSelect({ value, onChange, all, options, label }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-auto min-w-36 text-xs" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TabPills({ value, onChange, tabs }) {
  return (
    <div className="flex max-w-full shrink-0 overflow-x-auto rounded-lg bg-muted p-0.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={
            "shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
            (value === t.key
              ? "bg-card text-foreground shadow-card"
              : "text-muted-foreground hover:text-foreground")
          }
        >
          {t.label}
          {t.count !== undefined && t.count !== null && (
            <span className="num ml-1 text-muted-foreground">
              {" "}
              ({typeof t.count === "number" ? t.count.toLocaleString("en-IN") : t.count})
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
