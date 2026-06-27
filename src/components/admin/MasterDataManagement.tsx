import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Pencil, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Course = { id: string; course_name: string };
type CourseType = { id: string; course_id: string; type_name: string };
type Group = { id: string; course_id: string; type_id: string; group_name: string };
type Specialization = { id: string; course_id: string; type_id: string; specialization_name: string };

export function MasterDataManagement() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [types, setTypes] = useState<CourseType[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [specs, setSpecs] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCourse, setNewCourse] = useState('');
  const [editingCourse, setEditingCourse] = useState<{ id: string; name: string } | null>(null);

  const [typeForm, setTypeForm] = useState({ course_id: '', type_name: '' });
  const [groupForm, setGroupForm] = useState({ course_id: '', type_id: '', group_name: '' });
  const [specForm, setSpecForm] = useState({ course_id: '', type_id: '', specialization_name: '' });

  const fetchAll = async () => {
    setLoading(true);
    const [c, t, g, s] = await Promise.all([
      supabase.from('courses').select('*').order('course_name'),
      supabase.from('course_types').select('*').order('type_name'),
      supabase.from('groups').select('*').order('group_name'),
      supabase.from('specializations').select('*').order('specialization_name'),
    ]);
    setCourses((c.data as Course[]) || []);
    setTypes((t.data as CourseType[]) || []);
    setGroups((g.data as Group[]) || []);
    setSpecs((s.data as Specialization[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handle = async (action: () => Promise<{ error: any }>, ok: string) => {
    const { error } = await action();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: ok });
      fetchAll();
    }
  };

  const courseName = (id: string) => courses.find((c) => c.id === id)?.course_name || '—';
  const typeName = (id: string) => types.find((t) => t.id === id)?.type_name || '—';
  const typesForCourse = (cid: string) => types.filter((t) => t.course_id === cid);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Master Data Management</CardTitle>
        <CardDescription>Manage courses, course types, groups and honours specializations</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="courses">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="types">Course Types</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="specs">Specializations</TabsTrigger>
          </TabsList>

          {/* Courses */}
          <TabsContent value="courses">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="e.g. B.A, B.Com, BCA, MCA"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
              />
              <Button
                onClick={() => {
                  if (!newCourse.trim()) return;
                  handle(
                    () => supabase.from('courses').insert({ course_name: newCourse.trim() }) as any,
                    'Course added'
                  );
                  setNewCourse('');
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {editingCourse?.id === c.id ? (
                        <Input
                          value={editingCourse.name}
                          onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })}
                        />
                      ) : (
                        c.course_name
                      )}
                    </TableCell>
                    <TableCell className="space-x-1">
                      {editingCourse?.id === c.id ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              handle(
                                () =>
                                  supabase
                                    .from('courses')
                                    .update({ course_name: editingCourse.name.trim() })
                                    .eq('id', c.id) as any,
                                'Course updated'
                              );
                              setEditingCourse(null);
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingCourse(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingCourse({ id: c.id, name: c.course_name })}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handle(() => supabase.from('courses').delete().eq('id', c.id) as any, 'Course deleted')
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No courses yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Course Types */}
          <TabsContent value="types">
            <div className="grid md:grid-cols-3 gap-2 mb-4">
              <Select value={typeForm.course_id} onValueChange={(v) => setTypeForm({ ...typeForm, course_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Type (General, Honours, Computers...)"
                value={typeForm.type_name}
                onChange={(e) => setTypeForm({ ...typeForm, type_name: e.target.value })}
              />
              <Button
                onClick={() => {
                  if (!typeForm.course_id || !typeForm.type_name.trim()) return;
                  handle(
                    () =>
                      supabase
                        .from('course_types')
                        .insert({ course_id: typeForm.course_id, type_name: typeForm.type_name.trim() }) as any,
                    'Type added'
                  );
                  setTypeForm({ course_id: '', type_name: '' });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Type
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{courseName(t.course_id)}</TableCell>
                    <TableCell>{t.type_name}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handle(() => supabase.from('course_types').delete().eq('id', t.id) as any, 'Type deleted')
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {types.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">No types yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Groups */}
          <TabsContent value="groups">
            <div className="grid md:grid-cols-4 gap-2 mb-4">
              <Select value={groupForm.course_id} onValueChange={(v) => setGroupForm({ ...groupForm, course_id: v, type_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={groupForm.type_id} onValueChange={(v) => setGroupForm({ ...groupForm, type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {typesForCourse(groupForm.course_id).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.type_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Group (EPP, HPP, PSP...)"
                value={groupForm.group_name}
                onChange={(e) => setGroupForm({ ...groupForm, group_name: e.target.value })}
              />
              <Button
                onClick={() => {
                  if (!groupForm.course_id || !groupForm.type_id || !groupForm.group_name.trim()) return;
                  handle(
                    () =>
                      supabase.from('groups').insert({
                        course_id: groupForm.course_id,
                        type_id: groupForm.type_id,
                        group_name: groupForm.group_name.trim(),
                      }) as any,
                    'Group added'
                  );
                  setGroupForm({ course_id: '', type_id: '', group_name: '' });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Group
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{courseName(g.course_id)}</TableCell>
                    <TableCell>{typeName(g.type_id)}</TableCell>
                    <TableCell>{g.group_name}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handle(() => supabase.from('groups').delete().eq('id', g.id) as any, 'Group deleted')
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {groups.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No groups yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Specializations */}
          <TabsContent value="specs">
            <div className="grid md:grid-cols-4 gap-2 mb-4">
              <Select value={specForm.course_id} onValueChange={(v) => setSpecForm({ ...specForm, course_id: v, type_id: '' })}>
                <SelectTrigger><SelectValue placeholder="Course" /></SelectTrigger>
                <SelectContent>
                  {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.course_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={specForm.type_id} onValueChange={(v) => setSpecForm({ ...specForm, type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {typesForCourse(specForm.course_id).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.type_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Specialization (Economics, English...)"
                value={specForm.specialization_name}
                onChange={(e) => setSpecForm({ ...specForm, specialization_name: e.target.value })}
              />
              <Button
                onClick={() => {
                  if (!specForm.course_id || !specForm.type_id || !specForm.specialization_name.trim()) return;
                  handle(
                    () =>
                      supabase.from('specializations').insert({
                        course_id: specForm.course_id,
                        type_id: specForm.type_id,
                        specialization_name: specForm.specialization_name.trim(),
                      }) as any,
                    'Specialization added'
                  );
                  setSpecForm({ course_id: '', type_id: '', specialization_name: '' });
                }}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {specs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{courseName(s.course_id)}</TableCell>
                    <TableCell>{typeName(s.type_id)}</TableCell>
                    <TableCell>{s.specialization_name}</TableCell>
                    <TableCell>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          handle(
                            () => supabase.from('specializations').delete().eq('id', s.id) as any,
                            'Specialization deleted'
                          )
                        }
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {specs.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No specializations yet</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}