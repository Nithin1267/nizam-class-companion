import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, AlertTriangle, Users, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  percentage: number;
  total_classes: number;
  attended_classes: number;
}

interface SendAlertsProps {
  subjects: Subject[];
}

export function SendAlerts({ subjects }: SendAlertsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [students, setStudents] = useState<StudentWithAttendance[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'below75' | 'below60'>('below75');

  useEffect(() => {
    fetchLowAttendanceStudents();
  }, [selectedSubject, filterType]);

  const fetchLowAttendanceStudents = async () => {
    setLoading(true);

    try {
      // Fetch all students with their attendance summaries
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('roll_number');

      if (error) throw error;

      if (profiles) {
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
              id: profile.id,
              user_id: profile.user_id,
              name: profile.name,
              roll_number: profile.roll_number,
              email: profile.email,
              percentage,
              total_classes: totalClasses,
              attended_classes: attendedClasses,
            };
          })
        );

        // Filter based on attendance threshold
        let filtered = studentsWithAttendance.filter(s => s.total_classes > 0);
        
        if (filterType === 'below75') {
          filtered = filtered.filter(s => s.percentage < 75);
        } else if (filterType === 'below60') {
          filtered = filtered.filter(s => s.percentage < 60);
        }

        setStudents(filtered);
        // Auto-select all filtered students
        setSelectedStudents(filtered.map(s => s.user_id));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (userId: string) => {
    setSelectedStudents(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedStudents(students.map(s => s.user_id));
  };

  const deselectAll = () => {
    setSelectedStudents([]);
  };

  const sendAlerts = async () => {
    if (!user || selectedStudents.length === 0 || !message.trim()) {
      toast({
        title: 'Error',
        description: 'Please select students and write a message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // Create notifications for selected students
      const notifications = selectedStudents.map(studentId => ({
        user_id: studentId,
        title: 'Attendance Alert',
        message: message.trim(),
        type: 'alert',
      }));

      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) throw notifError;

      // Log the manual alerts
      const alertLogs = selectedStudents.map(studentId => ({
        teacher_id: user.id,
        student_id: studentId,
        subject_id: selectedSubject !== 'all' ? selectedSubject : null,
        message: message.trim(),
      }));

      const { error: alertError } = await supabase
        .from('manual_alerts')
        .insert(alertLogs);

      if (alertError) throw alertError;

      toast({
        title: 'Alerts Sent!',
        description: `Successfully sent alerts to ${selectedStudents.length} students`,
      });

      setMessage('');
      setSelectedStudents([]);
    } catch (error: any) {
      console.error('Error sending alerts:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send alerts',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const defaultMessage = `Dear Student,

This is to inform you that your attendance is currently below the required 75% threshold. Please ensure regular attendance to remain eligible for the semester examinations.

Current Status:
- Your attendance needs immediate improvement
- Minimum required: 75%

Please contact your class advisor or department if you have any concerns.

Regards,
Nizam College Administration`;

  return (
    <div className="space-y-6">
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
              <label className="text-sm font-medium">Attendance Filter</label>
              <Select value={filterType} onValueChange={(value: 'all' | 'below75' | 'below60') => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  <SelectItem value="below75">Below 75% (At Risk)</SelectItem>
                  <SelectItem value="below60">Below 60% (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Students
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No students match the current filter</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map(student => (
                  <div 
                    key={student.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.includes(student.user_id) 
                        ? 'border-secondary bg-secondary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleStudent(student.user_id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedStudents.includes(student.user_id)}
                        onCheckedChange={() => toggleStudent(student.user_id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{student.name}</span>
                          <Badge variant={student.percentage < 60 ? 'destructive' : 'outline'} className="text-xs">
                            {student.percentage}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{student.roll_number}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedStudents.length}</span> students selected
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Message Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compose Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMessage(defaultMessage)}
                >
                  Use Default Template
                </Button>
              </div>
              <Textarea
                placeholder="Type your alert message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="resize-none"
              />
              <Button 
                onClick={sendAlerts}
                disabled={sending || selectedStudents.length === 0 || !message.trim()}
                className="w-full"
                style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}
              >
                {sending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Send Alert to {selectedStudents.length} Students
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
