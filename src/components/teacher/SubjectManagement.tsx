import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen, FlaskConical, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  semester: number;
}

interface SubjectManagementProps {
  subjects: Subject[];
  onSubjectsChange: () => void;
  department: string;
}

export function SubjectManagement({ subjects, onSubjectsChange, department }: SubjectManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'theory' as 'theory' | 'lab',
    semester: 1,
  });
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'theory',
      semester: 1,
    });
  };

  const handleAddSubject = async () => {
    if (!user || !formData.name || !formData.code) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      // Create the subject
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          name: formData.name,
          code: formData.code,
          type: formData.type,
          department: department || 'Computer Science',
          semester: formData.semester,
          teacher_id: user.id,
        })
        .select()
        .single();

      if (subjectError) throw subjectError;

      // Assign subject to teacher
      const { error: assignError } = await supabase
        .from('teacher_subjects')
        .insert({
          teacher_id: user.id,
          subject_id: newSubject.id,
        });

      if (assignError) throw assignError;

      toast({
        title: 'Success!',
        description: 'Subject added successfully',
      });

      resetForm();
      setIsAddDialogOpen(false);
      onSubjectsChange();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add subject',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubject = async () => {
    if (!editingSubject || !formData.name || !formData.code) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('subjects')
        .update({
          name: formData.name,
          code: formData.code,
          type: formData.type,
          semester: formData.semester,
        })
        .eq('id', editingSubject.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Subject updated successfully',
      });

      resetForm();
      setIsEditDialogOpen(false);
      setEditingSubject(null);
      onSubjectsChange();
    } catch (error: any) {
      console.error('Error updating subject:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subject',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Subject deleted successfully',
      });

      onSubjectsChange();
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subject',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      type: subject.type as 'theory' | 'lab',
      semester: subject.semester,
    });
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Subjects</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  placeholder="e.g., Data Structures"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Code</Label>
                <Input
                  placeholder="e.g., CS301"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'theory' | 'lab') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select 
                  value={formData.semester.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddSubject} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Adding...' : 'Add Subject'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {subjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No subjects added yet</p>
            <p className="text-sm">Click "Add Subject" to create your first subject</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map(subject => (
              <div 
                key={subject.id}
                className="p-4 border rounded-lg hover:border-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${subject.type === 'theory' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                      {subject.type === 'theory' ? (
                        <BookOpen className="w-5 h-5 text-primary" />
                      ) : (
                        <FlaskConical className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{subject.name}</h3>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(subject)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSubject(subject.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${subject.type === 'theory' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                    {subject.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Sem {subject.semester}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  placeholder="e.g., Data Structures"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Subject Code</Label>
                <Input
                  placeholder="e.g., CS301"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value: 'theory' | 'lab') => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory</SelectItem>
                    <SelectItem value="lab">Lab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select 
                  value={formData.semester.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleEditSubject} 
                disabled={saving}
                className="w-full"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
