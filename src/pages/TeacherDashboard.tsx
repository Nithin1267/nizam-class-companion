import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, LogOut, Users, BookOpen, Bell, ClipboardCheck, Plus, AlertTriangle } from 'lucide-react';
import { MarkAttendance } from '@/components/teacher/MarkAttendance';
import { StudentList } from '@/components/teacher/StudentList';
import { SubjectManagement } from '@/components/teacher/SubjectManagement';
import { SendAlerts } from '@/components/teacher/SendAlerts';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  type: string;
  department: string;
  semester: number;
}

export function TeacherDashboard() {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [lowAttendanceCount, setLowAttendanceCount] = useState(0);
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/teacher');
      return;
    }
    
    if (!loading && role && role !== 'teacher' && role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You need teacher privileges to access this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (user) {
      fetchProfile();
      fetchSubjects();
      fetchStats();
    }
  }, [user, role, loading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (data) setProfile(data);
  };

  const fetchSubjects = async () => {
    if (!user) return;
    
    // Get subjects assigned to this teacher
    const { data: teacherSubjects } = await supabase
      .from('teacher_subjects')
      .select('subject_id')
      .eq('teacher_id', user.id);

    if (teacherSubjects && teacherSubjects.length > 0) {
      const subjectIds = teacherSubjects.map(ts => ts.subject_id);
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .in('id', subjectIds);
      
      if (data) setSubjects(data);
    }
  };

  const fetchStats = async () => {
    // Count students in teacher's department
    if (!profile) return;
    
    const { count: students } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('department', profile.department);
    
    if (students) setStudentCount(students);

    // Count students with low attendance in teacher's subjects
    const { count: lowAttendance } = await supabase
      .from('attendance_summary')
      .select('*', { count: 'exact', head: true })
      .lt('percentage', 75);
    
    if (lowAttendance) setLowAttendanceCount(lowAttendance);
  };

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/teacher');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">Nizam College</h1>
              <p className="text-xs text-muted-foreground">Teacher Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-medium">{profile?.name || 'Teacher'}</p>
                <p className="text-xs text-muted-foreground">{profile?.department}</p>
              </div>
            </div>
            
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-display text-foreground">
            Welcome, {profile?.name?.split(' ')[0] || 'Teacher'}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your classes and student attendance
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <BookOpen className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{subjects.length}</p>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{studentCount}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{lowAttendanceCount}</p>
                  <p className="text-sm text-muted-foreground">Below 75%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <ClipboardCheck className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Today</p>
                  <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="attendance" className="gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Mark Attendance
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" />
              Send Alerts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <MarkAttendance subjects={subjects} onAttendanceMarked={fetchStats} />
          </TabsContent>

          <TabsContent value="students">
            <StudentList subjects={subjects} />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectManagement 
              subjects={subjects} 
              onSubjectsChange={fetchSubjects}
              department={profile?.department || ''}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <SendAlerts subjects={subjects} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
