import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddStudentDialog } from './AddStudentDialog';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface StudentWithAttendance {
  id: string;
  user_id: string;
  name: string;
  roll_number: string;
  email: string;
  department: string;
  semester: number;
  attendance?: {
    total_classes: number;
    attended_classes: number;
    percentage: number;
  };
}

interface StudentListProps {
  subjects: Subject[];
  defaultDepartment?: string;
}

export function StudentList({ subjects, defaultDepartment = '' }: StudentListProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [selectedSubject]);

  const fetchStudents = async () => {
    setLoading(true);

    try {
      // Fetch all students
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('roll_number');

      if (error) throw error;

      if (profiles) {
        // For each student, get their attendance summary
        const studentsWithAttendance: StudentWithAttendance[] = await Promise.all(
          profiles.map(async (profile) => {
            let query = supabase
              .from('attendance_summary')
              .select('*')
              .eq('user_id', profile.user_id);

            if (selectedSubject !== 'all') {
              query = query.eq('subject_id', selectedSubject);
            }

            const { data: summaries } = await query;

            // Calculate overall attendance across subjects
            let totalClasses = 0;
            let attendedClasses = 0;

            if (summaries) {
              summaries.forEach(summary => {
                totalClasses += summary.total_classes;
                attendedClasses += summary.attended_classes;
              });
            }

            const percentage = totalClasses > 0 
              ? Math.round((attendedClasses / totalClasses) * 100 * 10) / 10
              : 0;

            return {
              ...profile,
              attendance: {
                total_classes: totalClasses,
                attended_classes: attendedClasses,
                percentage,
              },
            };
          })
        );

        setStudents(studentsWithAttendance);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowAttendanceStudents = filteredStudents.filter(s => 
    s.attendance && s.attendance.percentage < 75 && s.attendance.total_classes > 0
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Student Management</h2>
        <AddStudentDialog 
          defaultDepartment={defaultDepartment} 
          onStudentAdded={fetchStudents} 
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll no, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Attendance Alert */}
      {lowAttendanceStudents.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Students Below 75% Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowAttendanceStudents.map(student => (
                <Badge key={student.id} variant="destructive">
                  {student.name} - {student.attendance?.percentage}%
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No students found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map(student => (
                <div 
                  key={student.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{student.name}</h3>
                        {student.attendance && student.attendance.total_classes > 0 && (
                          student.attendance.percentage >= 75 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          )
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    </div>
                    <div className="text-right">
                      {student.attendance && student.attendance.total_classes > 0 ? (
                        <>
                          <p className={cn(
                            "text-2xl font-bold",
                            student.attendance.percentage >= 75 ? 'text-green-600' : 'text-destructive'
                          )}>
                            {student.attendance.percentage}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {student.attendance.attended_classes}/{student.attendance.total_classes} classes
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">No data</p>
                      )}
                    </div>
                  </div>
                  {student.attendance && student.attendance.total_classes > 0 && (
                    <Progress 
                      value={student.attendance.percentage} 
                      className={cn(
                        "mt-3 h-2",
                        student.attendance.percentage >= 75 ? '[&>div]:bg-green-500' : '[&>div]:bg-destructive'
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
