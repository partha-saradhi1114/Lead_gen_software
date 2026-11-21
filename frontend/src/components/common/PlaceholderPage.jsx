import { Link } from "react-router-dom";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({ title, description, children }) {
  return (
    <div className="space-y-4">
      {children}
      <div className="panel flex flex-col items-center px-6 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-tint-blue text-tint-blue-foreground">
          <Construction className="size-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <Button asChild variant="soft" size="sm" className="mt-5">
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
