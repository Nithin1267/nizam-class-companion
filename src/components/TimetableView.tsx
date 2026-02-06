import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Clock, MapPin } from "lucide-react";

interface TimetableEntry {
  id: string;
  subject_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number: string | null;
  subject?: {
    name: string;
    code: string;
    type: string;
  };
}

interface TimetableViewProps {
  semester: number;
  department: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function TimetableView({ semester, department }: TimetableViewProps) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().getDay();

  useEffect(() => {
    fetchTimetable();
  }, [semester, department]);

  const fetchTimetable = async () => {
    try {
      // First get subjects for this semester/department
      const { data: subjects } = await supabase
        .from("subjects")
        .select("id")
        .eq("semester", semester)
        .eq("department", department);

      if (!subjects || subjects.length === 0) {
        setTimetable([]);
        return;
      }

      const subjectIds = subjects.map((s) => s.id);

      // Then get timetable entries for those subjects
      const { data, error } = await supabase
        .from("timetable")
        .select("*, subject:subjects(name, code, type)")
        .in("subject_id", subjectIds)
        .order("start_time", { ascending: true });

      if (!error && data) {
        setTimetable(data as unknown as TimetableEntry[]);
      }
    } catch (err) {
      console.error("Error fetching timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    // Parse time string (HH:MM:SS) and format as 12-hour
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, "h:mm a");
  };

  const groupedByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    entries: timetable.filter((entry) => entry.day_of_week === index),
  })).filter((group) => group.entries.length > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading schedule...</p>
        </CardContent>
      </Card>
    );
  }

  if (groupedByDay.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Weekly Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            No schedule available yet. Your teachers will set up the timetable.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Weekly Timetable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groupedByDay.map(({ day, dayIndex, entries }) => (
          <div
            key={day}
            className={`rounded-lg border p-3 ${
              dayIndex === today
                ? "border-primary bg-primary/5"
                : "border-border"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-semibold">{day}</h4>
              {dayIndex === today && (
                <Badge variant="default" className="text-xs">
                  Today
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {entry.subject?.name || "Unknown Subject"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                      </span>
                      {entry.room_number && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {entry.room_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      entry.subject?.type === "lab"
                        ? "bg-secondary/10 text-secondary"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {entry.subject?.code}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
