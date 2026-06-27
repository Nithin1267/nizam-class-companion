import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, UserCog, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TeacherProfile {
  user_id: string;
  name: string;
  email: string;
  department?: string | null;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  semester: number;
}

interface Assignment {
  id: string;
  teacher_id: string;
  department: string;
  semester: number;
}

export function TeacherAssignments() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teacherSubjectRows, setTeacherSubjectRows] = useState<{ teacher_id: string; subject_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [teacherId, setTeacherId] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [semester, setSemester] = useState<string>('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());

  const departments = useMemo(
    () => Array.from(new Set(subjects.map((s) => s.department))).sort(),
    [subjects],
  );
  const semesters = useMemo(() => {
    if (!department) return [] as number[];
    return Array.from(new Set(subjects.filter((s) => s.department === department).map((s) => s.semester))).sort(
      (a, b) => a - b,
    );
  }, [subjects, department]);

  const filteredSubjects = useMemo(() => {
    if (!department || !semester) return [] as Subject[];
    return subjects.filter((s) => s.department === department && s.semester === Number(semester));
  }, [subjects, department, semester]);

  useEffect(() => {
    void loadAll();
  }, []);

  // When teacher/dept/semester selection matches existing assignment, prefill subjects
  useEffect(() => {
    if (!teacherId || !department || !semester) {
      setSelectedSubjectIds(new Set());
      return;
    }
    const subjectIdsForGroup = new Set(
      filteredSubjects
        .filter((s) =>
          teacherSubjectRows.some((ts) => ts.teacher_id === teacherId && ts.subject_id === s.id),
        )
        .map((s) => s.id),
    );
    setSelectedSubjectIds(subjectIdsForGroup);
  }, [teacherId, department, semester, teacherSubjectRows, filteredSubjects]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [{ data: roles }, { data: subjectsData }, { data: assignmentsData }, { data: tsRows }] =
        await Promise.all([
          supabase.from('user_roles').select('user_id').eq('role', 'teacher'),
          supabase.from('subjects').select('*').order('department').order('semester').order('name'),
          supabase.from('teacher_assignments').select('*').order('created_at', { ascending: false }),
          supabase.from('teacher_subjects').select('teacher_id, subject_id'),
        ]);

      const teacherIds = (roles ?? []).map((r) => r.user_id);
      let teacherProfiles: TeacherProfile[] = [];
      if (teacherIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, email, department')
          .in('user_id', teacherIds);
        teacherProfiles = (profiles ?? []) as TeacherProfile[];
        // Include teachers without a profile row
        for (const id of teacherIds) {
          if (!teacherProfiles.find((p) => p.user_id === id)) {
            teacherProfiles.push({ user_id: id, name: 'Unnamed Teacher', email: '' });
          }
        }
        teacherProfiles.sort((a, b) => a.name.localeCompare(b.name));
      }

      setTeachers(teacherProfiles);
      setSubjects((subjectsData ?? []) as Subject[]);
      setAssignments((assignmentsData ?? []) as Assignment[]);
      setTeacherSubjectRows((tsRows ?? []) as { teacher_id: string; subject_id: string }[]);
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!teacherId || !department || !semester) {
      toast({ title: 'Missing info', description: 'Pick teacher, department and semester.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      // Upsert assignment
      const { error: aErr } = await supabase
        .from('teacher_assignments')
        .upsert(
          { teacher_id: teacherId, department, semester: Number(semester) },
          { onConflict: 'teacher_id,department,semester' },
        );
      if (aErr) throw aErr;

      // Replace teacher_subjects rows for the subjects within this dept+sem
      const subjectIdsInGroup = filteredSubjects.map((s) => s.id);
      if (subjectIdsInGroup.length > 0) {
        const { error: delErr } = await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', teacherId)
          .in('subject_id', subjectIdsInGroup);
        if (delErr) throw delErr;
      }

      const inserts = Array.from(selectedSubjectIds).map((subject_id) => ({
        teacher_id: teacherId,
        subject_id,
      }));
      if (inserts.length > 0) {
        const { error: insErr } = await supabase.from('teacher_subjects').insert(inserts);
        if (insErr) throw insErr;
      }

      toast({ title: 'Saved', description: 'Teacher assignment updated.' });
      await loadAll();
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err.message ?? 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (a: Assignment) => {
    if (!confirm(`Remove ${a.department} - Semester ${a.semester} from this teacher?`)) return;
    try {
      // Remove teacher_subjects belonging to this dept+sem too
      const subjectIdsInGroup = subjects
        .filter((s) => s.department === a.department && s.semester === a.semester)
        .map((s) => s.id);
      if (subjectIdsInGroup.length > 0) {
        await supabase
          .from('teacher_subjects')
          .delete()
          .eq('teacher_id', a.teacher_id)
          .in('subject_id', subjectIdsInGroup);
      }
      const { error } = await supabase.from('teacher_assignments').delete().eq('id', a.id);
      if (error) throw error;
      toast({ title: 'Removed', description: 'Assignment removed.' });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message ?? 'Failed', variant: 'destructive' });
    }
  };

  const teacherName = (id: string) => teachers.find((t) => t.user_id === id)?.name ?? 'Unknown';
  const subjectsForAssignment = (a: Assignment) =>
    subjects.filter(
      (s) =>
        s.department === a.department &&
        s.semester === a.semester &&
        teacherSubjectRows.some((ts) => ts.teacher_id === a.teacher_id && ts.subject_id === s.id),
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" /> Assign Teacher
          </CardTitle>
          <CardDescription>
            Select a teacher, then assign them to a department, semester, and one or more subjects.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Teacher</label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-muted-foreground">No teachers found</div>
                  ) : (
                    teachers.map((t) => (
                      <SelectItem key={t.user_id} value={t.user_id}>
                        {t.name} {t.email ? `· ${t.email}` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select
                value={department}
                onValueChange={(v) => {
                  setDepartment(v);
                  setSemester('');
                }}
              >
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
              <label className="text-sm font-medium">Semester</label>
              <Select value={semester} onValueChange={setSemester} disabled={!department}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Subjects</label>
            {!department || !semester ? (
              <p className="text-sm text-muted-foreground">
                Pick a department and semester to see available subjects.
              </p>
            ) : filteredSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects in this department / semester.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-lg p-3 max-h-72 overflow-auto">
                {filteredSubjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-start gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedSubjectIds.has(s.id)}
                      onCheckedChange={() => toggleSubject(s.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.code} · {s.type}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Assignment'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Assignments</CardTitle>
          <CardDescription>Each row shows a teacher's scope and their selected subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No assignments yet.</p>
          ) : (
            <div className="space-y-3">
              {assignments.map((a) => {
                const subs = subjectsForAssignment(a);
                return (
                  <div
                    key={a.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{teacherName(a.teacher_id)}</p>
                      <p className="text-sm text-muted-foreground">
                        {a.department} · Semester {a.semester}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {subs.length === 0 ? (
                          <Badge variant="outline">No subjects</Badge>
                        ) : (
                          subs.map((s) => (
                            <Badge key={s.id} variant="secondary" className="text-xs">
                              {s.code}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive self-end md:self-auto"
                      onClick={() => handleRemoveAssignment(a)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
