import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface CalendarRecord {
  date: string; // YYYY-MM-DD
  subject: string;
  status: "present" | "absent";
  type: "theory" | "lab";
}

interface Props {
  records: CalendarRecord[];
  /** ISO dates marked as holiday */
  holidays?: string[];
  /** ISO dates marked as approved leave */
  leaves?: string[];
}

function toISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function AttendanceCalendar({
  records,
  holidays = [],
  leaves = [],
}: Props) {
  const [selected, setSelected] = useState<Date | undefined>(new Date());

  const { presentDays, absentDays, holidayDays, leaveDays, byDate } =
    useMemo(() => {
      const byDate = new Map<string, CalendarRecord[]>();
      records.forEach((r) => {
        const list = byDate.get(r.date) ?? [];
        list.push(r);
        byDate.set(r.date, list);
      });
      const allPresent = new Set<string>();
      const anyAbsent = new Set<string>();
      byDate.forEach((list, date) => {
        if (list.some((r) => r.status === "absent")) anyAbsent.add(date);
        else allPresent.add(date);
      });
      const toDate = (s: string) => {
        const [y, m, d] = s.split("-").map(Number);
        return new Date(y, m - 1, d);
      };
      return {
        presentDays: [...allPresent].map(toDate),
        absentDays: [...anyAbsent].map(toDate),
        holidayDays: holidays.map(toDate),
        leaveDays: leaves.map(toDate),
        byDate,
      };
    }, [records, holidays, leaves]);

  const selectedISO = selected ? toISO(selected) : "";
  const selectedRecords = byDate.get(selectedISO) ?? [];
  const isHoliday = holidays.includes(selectedISO);
  const isLeave = leaves.includes(selectedISO);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Attendance Calendar</CardTitle>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2">
          <LegendDot className="bg-success" label="Present" />
          <LegendDot className="bg-destructive" label="Absent" />
          <LegendDot className="bg-warning" label="Holiday" />
          <LegendDot className="bg-primary" label="Approved Leave" />
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-[auto,1fr]">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={setSelected}
          className="rounded-md border pointer-events-auto"
          modifiers={{
            present: presentDays,
            absent: absentDays,
            holiday: holidayDays,
            leave: leaveDays,
          }}
          modifiersClassNames={{
            present:
              "bg-success/15 text-success font-semibold hover:bg-success/25",
            absent:
              "bg-destructive/15 text-destructive font-semibold hover:bg-destructive/25",
            holiday:
              "bg-warning/15 text-warning font-semibold hover:bg-warning/25",
            leave:
              "bg-primary/15 text-primary font-semibold hover:bg-primary/25",
          }}
        />

        <div className="min-w-0">
          <p className="text-sm font-semibold mb-2">
            {selected ? format(selected, "EEEE, MMM d, yyyy") : "Pick a date"}
          </p>

          {isHoliday && (
            <Badge className="bg-warning/15 text-warning hover:bg-warning/25 mb-3">
              Holiday
            </Badge>
          )}
          {isLeave && (
            <Badge className="bg-primary/15 text-primary hover:bg-primary/25 mb-3 ml-2">
              Approved Leave
            </Badge>
          )}

          {selectedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No attendance recorded on this day.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedRecords.map((r, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md border p-2 text-sm",
                    r.status === "present"
                      ? "border-success/30 bg-success/5"
                      : "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.subject}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {r.type}
                    </p>
                  </div>
                  {r.status === "present" ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-destructive shrink-0" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("w-2.5 h-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}