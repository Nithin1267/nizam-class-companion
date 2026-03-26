import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, LogOut, Users, BookOpen, BarChart3, UserCog, Shield } from 'lucide-react';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { SubjectOverview } from '@/components/admin/SubjectOverview';
import { useToast } from '@/hooks/use-toast';

interface Stats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  lowAttendanceStudents: number;
  avgAttendance: number;
}

export function AdminDashboard() {
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    lowAttendanceStudents: 0,
    avgAttendance: 0,
  });
  const [activeTab, setActiveTab] = useState('analytics');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
      return;
    }
    
    if (!loading && role && role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You need admin privileges to access this page.',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    if (user && role === 'admin') {
      fetchStats();
    }
  }, [user, role, loading, navigate]);

  const fetchStats = async () => {
    // Count students
    const { count: studentCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'student');

    // Count teachers
    const { count: teacherCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'teacher');

    // Count subjects
    const { count: subjectCount } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true });

    // Count students with low attendance
    const { count: lowAttendance } = await supabase
      .from('attendance_summary')
      .select('*', { count: 'exact', head: true })
      .lt('percentage', 75);

    // Calculate average attendance
    const { data: attendanceData } = await supabase
      .from('attendance_summary')
      .select('percentage');

    let avgAttendance = 0;
    if (attendanceData && attendanceData.length > 0) {
      avgAttendance = attendanceData.reduce((sum, row) => sum + Number(row.percentage), 0) / attendanceData.length;
    }

    setStats({
      totalStudents: studentCount || 0,
      totalTeachers: teacherCount || 0,
      totalSubjects: subjectCount || 0,
      lowAttendanceStudents: lowAttendance || 0,
      avgAttendance: Math.round(avgAttendance * 10) / 10,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">Nizam College</h1>
              <p className="text-xs text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-right">
              <div>
                <p className="text-sm font-medium">Administrator</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
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
            Admin Control Panel 🛡️
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage users, monitor attendance, and oversee system operations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <UserCog className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTeachers}</p>
                  <p className="text-sm text-muted-foreground">Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSubjects}</p>
                  <p className="text-sm text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
                  <p className="text-sm text-muted-foreground">Avg Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lowAttendanceStudents}</p>
                  <p className="text-sm text-muted-foreground">Below 75%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="subjects" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Subjects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <SystemAnalytics />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="subjects">
            <SubjectOverview />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
