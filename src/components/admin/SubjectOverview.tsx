import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Users, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  semester: number;
  teacher_id: string | null;
  created_at: string;
}

interface TeacherSubject {
  subject_id: string;
  teacher_id: string;
  teacher_name?: string;
}

export function SubjectOverview() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch all subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('department', { ascending: true });

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
    } else {
      setSubjects(subjectsData || []);
    }

    // Fetch teacher assignments
    const { data: assignmentsData } = await supabase
      .from('teacher_subjects')
      .select('subject_id, teacher_id');

    // Get teacher names
    if (assignmentsData) {
      const teacherIds = [...new Set(assignmentsData.map(a => a.teacher_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', teacherIds);

      const enrichedAssignments = assignmentsData.map(a => ({
        ...a,
        teacher_name: profiles?.find(p => p.user_id === a.teacher_id)?.name || 'Unknown',
      }));
      setTeacherAssignments(enrichedAssignments);
    }

    setLoading(false);
  };

  const deleteSubject = async (subject: Subject) => {
    if (!confirm(`Are you sure you want to delete "${subject.name}"?`)) return;

    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subject.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete subject',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Success',
      description: `"${subject.name}" has been deleted`,
    });

    fetchData();
  };

  const getTeachersForSubject = (subjectId: string) => {
    return teacherAssignments
      .filter(a => a.subject_id === subjectId)
      .map(a => a.teacher_name)
      .join(', ');
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by department
  const subjectsByDepartment = filteredSubjects.reduce((acc, subject) => {
    if (!acc[subject.department]) {
      acc[subject.department] = [];
    }
    acc[subject.department].push(subject);
    return acc;
  }, {} as Record<string, Subject[]>);

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
          <CardTitle>Subject Overview</CardTitle>
          <CardDescription>View all subjects and their assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search subjects by name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{subjects.length}</p>
              <p className="text-sm text-muted-foreground">Total Subjects</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{Object.keys(subjectsByDepartment).length}</p>
              <p className="text-sm text-muted-foreground">Departments</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{subjects.filter(s => s.type === 'Theory').length}</p>
              <p className="text-sm text-muted-foreground">Theory</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{subjects.filter(s => s.type === 'Lab').length}</p>
              <p className="text-sm text-muted-foreground">Labs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects by Department */}
      {Object.entries(subjectsByDepartment).map(([department, deptSubjects]) => (
        <Card key={department}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {department}
              <Badge variant="secondary" className="ml-2">
                {deptSubjects.length} subjects
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Subject</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Code</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Type</th>
                    <th className="px-4 py-3 text-center text-sm font-medium hidden sm:table-cell">Semester</th>
                    <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Teachers</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deptSubjects.map((subject, index) => {
                    const teachers = getTeachersForSubject(subject.id);
                    return (
                      <tr 
                        key={subject.id}
                        className={cn(
                          "border-t",
                          index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{subject.code}</p>
                        </td>
                        <td className="px-4 py-3 text-sm hidden md:table-cell">
                          {subject.code}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={subject.type === 'Lab' ? 'secondary' : 'outline'}>
                            {subject.type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">
                          Sem {subject.semester}
                        </td>
                        <td className="px-4 py-3 text-sm hidden lg:table-cell">
                          {teachers || (
                            <span className="text-muted-foreground italic">No teachers assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteSubject(subject)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(subjectsByDepartment).length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No subjects found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
