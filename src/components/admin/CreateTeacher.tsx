import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, UserPlus, KeyRound, BookOpen } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  semester: number;
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  const cryptoObj = (globalThis as any).crypto;
  const buf = new Uint32Array(12);
  cryptoObj.getRandomValues(buf);
  for (let i = 0; i < 12; i++) out += chars[buf[i] % chars.length];
  return out + "!7";
}

export function CreateTeacher() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(generatePassword());
  const [department, setDepartment] = useState<string>("");
  const [semester, setSemester] = useState<string>("1");
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name,code,type,department,semester")
        .order("department")
        .order("semester")
        .order("name");
      if (error) toast.error("Failed to load subjects");
      setSubjects((data as Subject[]) || []);
      setLoadingSubjects(false);
    })();
  }, []);

  const departments = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.department))).sort(),
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const sem = parseInt(semester);
    return subjects.filter(
      (s) => (!department || s.department === department) && (!sem || s.semester === sem)
    );
  }, [subjects, department, semester]);

  const toggleSubject = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const reset = () => {
    setName("");
    setEmail("");
    setPassword(generatePassword());
    setSection("");
    setSelected(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Teacher name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (!department) return toast.error("Select a department");
    if (selected.size === 0) return toast.error("Select at least one subject");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-teacher", {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          department,
          semester: parseInt(semester),
          section: section.trim() || null,
          subjectIds: Array.from(selected),
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success(`Teacher "${name}" created. They can sign in with ${email}.`);
      reset();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create teacher");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Create Teacher
        </CardTitle>
        <CardDescription>
          Add a new teacher account, scope them to a department/semester/section, and assign
          their subjects in one step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Teacher Name *</Label>
              <Input
                id="t-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dr. Priya Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-email">Email *</Label>
              <Input
                id="t-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@nizamcollege.ac.in"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="t-pass">Temporary Password *</Label>
              <div className="flex gap-2">
                <Input
                  id="t-pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPassword(generatePassword())}
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this password securely. The teacher can change it after first login.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semester *</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="t-section">Section (optional)</Label>
              <Input
                id="t-section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g., A"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to give access to all sections in this department/semester.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Assigned Subjects *
              </Label>
              <Badge variant="secondary">{selected.size} selected</Badge>
            </div>

            <div className="border rounded-lg max-h-72 overflow-y-auto divide-y">
              {loadingSubjects ? (
                <div className="p-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading subjects...
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {department
                    ? `No subjects found for ${department}, Semester ${semester}.`
                    : "Select a department to view subjects."}
                </div>
              ) : (
                filteredSubjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 p-3 hover:bg-accent/40 cursor-pointer"
                  >
                    <Checkbox
                      checked={selected.has(s.id)}
                      onCheckedChange={() => toggleSubject(s.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.code} · Sem {s.semester}
                      </p>
                    </div>
                    <Badge variant={s.type === "lab" ? "outline" : "secondary"}>
                      {s.type}
                    </Badge>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button type="button" variant="outline" onClick={reset} disabled={submitting}>
              Reset
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" /> Create Teacher
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}