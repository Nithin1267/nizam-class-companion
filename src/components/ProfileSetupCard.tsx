import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileSetupCardProps = {
  userId: string;
  email?: string | null;
  onCreated: () => void;
};

export function ProfileSetupCard({ userId, email, onCreated }: ProfileSetupCardProps) {
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("4");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const sem = Number(semester);
    return (
      name.trim().length >= 2 &&
      rollNumber.trim().length >= 2 &&
      department.trim().length >= 2 &&
      Number.isFinite(sem) &&
      sem >= 1 &&
      sem <= 12
    );
  }, [name, rollNumber, department, semester]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("profiles").insert({
        user_id: userId,
        email: email ?? "",
        name: name.trim(),
        roll_number: rollNumber.trim(),
        department: department.trim(),
        semester: Number(semester),
      });

      if (insertError) {
        setError(insertError.message);
        return;
      }

      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="font-display">Complete your profile</CardTitle>
        <CardDescription>
          We couldn’t find your profile yet. Fill this once to unlock your dashboard.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roll">Roll number</Label>
            <Input
              id="roll"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dept">Department</Label>
            <Input id="dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sem">Semester</Label>
            <Input
              id="sem"
              inputMode="numeric"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="submit" disabled={!canSubmit || submitting}>
            {submitting ? "Saving…" : "Save profile"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
