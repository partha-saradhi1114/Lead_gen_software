import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { BDE_STAGE_GROUPS, normalizeStage } from "@/lib/leadgen/bde";
import { StageBadge } from "./StageBadge";
import { cn } from "@/lib/utils";

export function SearchableStageSelect({ value, onChange, placeholder = "Select stage..." }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedVal = normalizeStage(value);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when opening
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Filter groups and stages based on query
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BDE_STAGE_GROUPS;

    return BDE_STAGE_GROUPS.map((group) => {
      const matchingStages = group.stages.filter((s) =>
        s.toLowerCase().includes(q) || group.name.toLowerCase().includes(q)
      );
      return {
        ...group,
        stages: matchingStages,
      };
    }).filter((group) => group.stages.length > 0);
  }, [query]);

  const totalMatches = filteredGroups.reduce((acc, g) => acc + g.stages.length, 0);

  const handleSelect = (stage) => {
    onChange(stage);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs ring-offset-background transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 truncate">
          {normalizedVal ? (
            <StageBadge stage={normalizedVal} />
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* Dropdown Menu with Search */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-80 w-full min-w-72 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
          {/* Search Box Header */}
          <div className="flex items-center border-b px-2.5 py-1.5 bg-muted/30">
            <Search className="mr-2 size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 36 stages (e.g. WhatsApp, Demo, Call Back)..."
              className="flex h-7 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Grouped Options List */}
          <div className="max-h-60 overflow-y-auto p-1 text-xs scrollbar-thin">
            {totalMatches === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No stages matching <span className="font-semibold text-foreground">"{query}"</span>
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.name} className="py-1">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 bg-muted/40 rounded-xs mb-0.5">
                    {group.name}
                  </div>
                  {group.stages.map((stage) => {
                    const isSelected = normalizedVal === stage;
                    return (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => handleSelect(stage)}
                        className={cn(
                          "relative flex w-full cursor-pointer select-none items-center justify-between rounded-sm px-2 py-1.5 text-xs outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-left",
                          isSelected && "bg-accent font-medium text-accent-foreground"
                        )}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-center gap-2">
                          <StageBadge stage={stage} />
                        </div>
                        {isSelected && <Check className="size-3.5 text-primary shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
          <div className="border-t bg-muted/20 px-2.5 py-1 text-[10px] text-muted-foreground flex justify-between">
            <span>{totalMatches} dispositions</span>
            <span>Type to filter</span>
          </div>
        </div>
      )}
    </div>
  );
}
