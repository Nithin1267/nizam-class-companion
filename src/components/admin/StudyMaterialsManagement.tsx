import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, FileText, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MATERIAL_TYPES = ['Syllabus', 'Previous Papers', 'Notes', 'PDF', 'Video Link'];

export function StudyMaterialsManagement() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    subject_id: '',
    material_type: 'Syllabus',
    title: '',
    file_link: '',
    medium: '',
  });

  const fetchAll = async () => {
    setLoading(true);
    const [m, s] = await Promise.all([
      supabase.from('study_materials').select('*').order('created_at', { ascending: false }),
      supabase.from('subjects').select('id, name, code').order('name'),
    ]);
    setMaterials(m.data || []);
    setSubjects(s.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const subjectName = (id: string | null) => subjects.find((s) => s.id === id)?.name || '—';

  const handleAdd = async () => {
    if (!form.title.trim() || !form.file_link.trim()) {
      toast({ title: 'Title and link required', variant: 'destructive' });
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('study_materials').insert({
      subject_id: form.subject_id || null,
      material_type: form.material_type,
      title: form.title.trim(),
      file_link: form.file_link.trim(),
      medium: form.medium.trim() || null,
      uploaded_by: user?.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Material added' });
      setForm({ subject_id: '', material_type: 'Syllabus', title: '', file_link: '', medium: '' });
      fetchAll();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('study_materials').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Deleted' }); fetchAll(); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Study Materials</CardTitle>
        <CardDescription>Upload syllabus, previous papers, notes and video links for students</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-2 mb-6">
          <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
            <SelectTrigger><SelectValue placeholder="Subject (optional)" /></SelectTrigger>
            <SelectContent>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.material_type} onValueChange={(v) => setForm({ ...form, material_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MATERIAL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input placeholder="Medium (English/Telugu)" value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })} />
          <Input placeholder="File / Video URL" value={form.file_link} onChange={(e) => setForm({ ...form, file_link: e.target.value })} />
          <Button onClick={handleAdd}><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Medium</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell><Badge variant="secondary">{m.material_type}</Badge></TableCell>
                <TableCell>{subjectName(m.subject_id)}</TableCell>
                <TableCell>{m.medium || '—'}</TableCell>
                <TableCell>
                  <a href={m.file_link} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No materials uploaded yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}