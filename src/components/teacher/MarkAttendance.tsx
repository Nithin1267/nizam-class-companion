import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Check, X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface Student {
  id: string;
  user_id: string;
  name: string;
  roll_number: string;
  email: string;
}

interface MarkAttendanceProps {
  subjects: Subject[];
  onAttendanceMarked: () => void;
}

export function MarkAttendance({ subjects, onAttendanceMarked }: MarkAttendanceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      fetchStudents();
    }
  }, [selectedSubject]);

  const fetchStudents = async () => {
    setLoading(true);
    
    // Get the subject details to find the department
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) {
      setLoading(false);
      return;
    }

    // Fetch students - for now, get all students (in a real app, filter by department/semester)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('roll_number');

    if (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students',
        variant: 'destructive',
      });
    } else if (data) {
      setStudents(data);
      // Initialize all as present by default
      const initialAttendance: Record<string, 'present' | 'absent'> = {};
      data.forEach(student => {
        initialAttendance[student.user_id] = 'present';
      });
      setAttendance(initialAttendance);
    }
    setLoading(false);
  };

  const toggleAttendance = (userId: string) => {
    setAttendance(prev => ({
      ...prev,
      [userId]: prev[userId] === 'present' ? 'absent' : 'present',
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, 'present' | 'absent'> = {};
    students.forEach(student => {
      newAttendance[student.user_id] = 'present';
    });
    setAttendance(newAttendance);
  };

  const markAllAbsent = () => {
    const newAttendance: Record<string, 'present' | 'absent'> = {};
    students.forEach(student => {
      newAttendance[student.user_id] = 'absent';
    });
    setAttendance(newAttendance);
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !user) return;

    setSaving(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      // First, delete existing attendance records for this date and subject
      await supabase
        .from('attendance_records')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('date', dateStr);

      // Insert new attendance records
      const records = Object.entries(attendance).map(([userId, status]) => ({
        user_id: userId,
        subject_id: selectedSubject,
        date: dateStr,
        status,
      }));

      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) throw error;

      // Update attendance summary for each student
      for (const [userId, status] of Object.entries(attendance)) {
        // Get or create summary
        const { data: existingSummary } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('user_id', userId)
          .eq('subject_id', selectedSubject)
          .maybeSingle();

        if (existingSummary) {
          // Update existing summary
          await supabase
            .from('attendance_summary')
            .update({
              total_classes: existingSummary.total_classes + 1,
              attended_classes: existingSummary.attended_classes + (status === 'present' ? 1 : 0),
            })
            .eq('id', existingSummary.id);
        } else {
          // Create new summary
          await supabase
            .from('attendance_summary')
            .insert({
              user_id: userId,
              subject_id: selectedSubject,
              total_classes: 1,
              attended_classes: status === 'present' ? 1 : 0,
            });
        }
      }

      toast({
        title: 'Success!',
        description: `Attendance saved for ${students.length} students`,
      });

      onAttendanceMarked();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Mark Attendance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {selectedSubject && students.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-4">
                <span className="text-sm">
                  <span className="font-medium text-green-600">{presentCount}</span> Present
                </span>
                <span className="text-sm">
                  <span className="font-medium text-red-600">{absentCount}</span> Absent
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <Check className="w-4 h-4 mr-1" /> All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                  <X className="w-4 h-4 mr-1" /> All Absent
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Roll No</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, index) => (
                    <tr 
                      key={student.id} 
                      className={cn(
                        "border-t cursor-pointer hover:bg-muted/50",
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      )}
                      onClick={() => toggleAttendance(student.user_id)}
                    >
                      <td className="px-4 py-3 text-sm">{student.roll_number}</td>
                      <td className="px-4 py-3 text-sm">{student.name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                            attendance[student.user_id] === 'present'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {attendance[student.user_id] === 'present' ? 'Present' : 'Absent'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button 
              onClick={saveAttendance} 
              disabled={saving}
              className="w-full"
              style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Attendance
                </span>
              )}
            </Button>
          </>
        )}

        {selectedSubject && loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!selectedSubject && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Select a subject to mark attendance</p>
          </div>
        )}

        {selectedSubject && !loading && students.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No students found for this subject</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
