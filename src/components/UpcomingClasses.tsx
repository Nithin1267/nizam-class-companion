import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Entry {
  id: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  faculty?: string | null;
  subject?: { name: string; code: string; type: string } | null;
}

interface Props {
  semester: number;
  department: string;
}

function fmt(t: string) {
  const [h, m] = t.split(":");
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return format(d, "h:mm a");
}

function nowHHMM() {
  return format(new Date(), "HH:mm:ss");
}

export function UpcomingClasses({ semester, department }: Props) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: subs } = await supabase
          .from("subjects")
          .select("id")
          .eq("semester", semester)
          .eq("department", department);

        if (!subs?.length) {
          if (active) {
            setEntries([]);
            setLoading(false);
          }
          return;
        }

        const today = new Date().getDay();
        const { data } = await supabase
          .from("timetable")
          .select("*, subject:subjects(name, code, type)")
          .in(
            "subject_id",
            subs.map((s) => s.id)
          )
          .eq("day_of_week", today)
          .order("start_time", { ascending: true });

        if (active) setEntries((data as unknown as Entry[]) || []);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [semester, department]);

  const now = nowHHMM();
  const upcoming = entries.filter((e) => e.end_time >= now);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-primary" />
          Upcoming Today
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No classes scheduled today. Enjoy your day! 🎉
          </p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            All of today's classes are done.
          </p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e, idx) => {
              const live = e.start_time <= now && e.end_time >= now;
              return (
                <li
                  key={e.id}
                  className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                    live
                      ? "border-primary bg-primary/5"
                      : idx === 0
                      ? "border-primary/40 bg-primary/[0.03]"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">
                        {e.subject?.name || "Class"}
                      </p>
                      {live && (
                        <Badge className="bg-success/15 text-success hover:bg-success/25">
                          Live now
                        </Badge>
                      )}
                      {!live && idx === 0 && (
                        <Badge variant="outline">Next</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {fmt(e.start_time)} – {fmt(e.end_time)}
                      </span>
                      {e.room_number && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Room {e.room_number}
                        </span>
                      )}
                      {e.faculty && (
                        <span className="flex items-center gap-1">
                          <User2 className="w-3 h-3" />
                          {e.faculty}
                        </span>
                      )}
                    </div>
                  </div>
                  {e.subject?.code && (
                    <Badge
                      variant="outline"
                      className={
                        e.subject?.type === "lab"
                          ? "bg-secondary/10 text-secondary"
                          : "bg-primary/10 text-primary"
                      }
                    >
                      {e.subject.code}
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}