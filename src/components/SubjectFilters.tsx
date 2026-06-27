import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SubjectFilter =
  | "all"
  | "theory"
  | "lab"
  | "safe"
  | "warning"
  | "critical";

const FILTERS: { id: SubjectFilter; label: string }[] = [
  { id: "all", label: "All Subjects" },
  { id: "theory", label: "Theory" },
  { id: "lab", label: "Labs" },
  { id: "safe", label: "Safe (≥75%)" },
  { id: "warning", label: "Warning (70–74%)" },
  { id: "critical", label: "Critical (<70%)" },
];

interface Props {
  value: SubjectFilter;
  onChange: (v: SubjectFilter) => void;
  counts?: Partial<Record<SubjectFilter, number>>;
}

export function SubjectFilters({ value, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTERS.map((f) => {
        const active = value === f.id;
        const count = counts?.[f.id];
        return (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onChange(f.id)}
            className={cn("rounded-full", active && "shadow-sm")}
          >
            {f.label}
            {typeof count === "number" && (
              <span
                className={cn(
                  "ml-2 text-xs rounded-full px-1.5 py-0.5",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

export function applySubjectFilter<
  T extends { type: "theory" | "lab"; percentage: number }
>(subjects: T[], filter: SubjectFilter): T[] {
  switch (filter) {
    case "theory":
      return subjects.filter((s) => s.type === "theory");
    case "lab":
      return subjects.filter((s) => s.type === "lab");
    case "safe":
      return subjects.filter((s) => s.percentage >= 75);
    case "warning":
      return subjects.filter((s) => s.percentage >= 70 && s.percentage < 75);
    case "critical":
      return subjects.filter((s) => s.percentage < 70);
    default:
      return subjects;
  }
}