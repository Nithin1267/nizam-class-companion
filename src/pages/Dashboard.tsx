import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { AttendanceCard } from '@/components/AttendanceCard';
import { SubjectTable } from '@/components/SubjectTable';
import { AttendanceChart } from '@/components/AttendanceChart';
import { AttendancePieChart } from '@/components/AttendancePieChart';
import { RecentAttendance } from '@/components/RecentAttendance';
import { StatsCard } from '@/components/StatsCard';
import { ProfileSetupCard } from '@/components/ProfileSetupCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BookOpen, FlaskConical, Target, Calendar, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { Subject, AttendanceRecord, Student } from '@/lib/mockData';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    if (!user) return;

    try {
      setProfileMissing(false);
      // Fetch student profile - RLS ensures only own data is returned
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        // If the user has no profile row yet, show the setup UI instead of a dead-end error.
        // PostgREST uses PGRST116 when `.single()` returns 0 rows.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const code = (profileError as any)?.code as string | undefined;
        if (code === 'PGRST116') {
          setStudent(null);
          setProfileMissing(true);
          return;
        }
        console.error('Error fetching profile:', profileError);
      } else if (profile) {
        setStudent({
          id: profile.user_id,
          name: profile.name,
          rollNumber: profile.roll_number,
          email: profile.email,
          department: profile.department,
          semester: profile.semester,
        });
      }

      // Fetch subjects for the student's semester/department
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*');

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError);
      }

      // Fetch attendance summary for this user - RLS ensures only own data
      const { data: summaryData, error: summaryError } = await supabase
        .from('attendance_summary')
        .select('*, subjects(name, code, type)')
        .eq('user_id', user.id);

      if (summaryError) {
        console.error('Error fetching attendance summary:', summaryError);
      }

      // Map attendance summary to subjects format
      if (summaryData && subjectsData) {
        const mappedSubjects: Subject[] = summaryData.map((summary: any) => ({
          id: summary.subject_id,
          name: summary.subjects?.name || 'Unknown Subject',
          code: summary.subjects?.code || 'N/A',
          type: (summary.subjects?.type || 'theory') as 'theory' | 'lab',
          totalClasses: summary.total_classes,
          attendedClasses: summary.attended_classes,
          percentage: summary.percentage,
        }));
        setSubjects(mappedSubjects);
      }

      // Fetch recent attendance records - RLS ensures only own data
      const { data: recordsData, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*, subjects(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (recordsError) {
        console.error('Error fetching attendance records:', recordsError);
      } else if (recordsData) {
        const mappedRecords: AttendanceRecord[] = recordsData.map((record: any) => ({
          date: record.date,
          subject: record.subjects?.name || 'Unknown',
          status: record.status as 'present' | 'absent',
          type: record.subjects?.type as 'theory' | 'lab' || 'theory',
        }));
        setAttendanceHistory(mappedRecords);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileMissing && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <ProfileSetupCard
          userId={user.id}
          email={user.email}
          onCreated={() => {
            setLoading(true);
            fetchStudentData();
          }}
        />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load your profile. Please try again.</p>
        </div>
      </div>
    );
  }

  // Calculate attendance statistics from real data
  const totalClasses = subjects.reduce((acc, s) => acc + s.totalClasses, 0);
  const attendedClasses = subjects.reduce((acc, s) => acc + s.attendedClasses, 0);
  const overallAttendance = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
  
  const theorySubjects = subjects.filter(s => s.type === 'theory');
  const labSubjects = subjects.filter(s => s.type === 'lab');
  
  const theoryTotal = theorySubjects.reduce((acc, s) => acc + s.totalClasses, 0);
  const theoryAttended = theorySubjects.reduce((acc, s) => acc + s.attendedClasses, 0);
  const theoryAttendance = theoryTotal > 0 ? Math.round((theoryAttended / theoryTotal) * 100) : 0;
  
  const labTotal = labSubjects.reduce((acc, s) => acc + s.totalClasses, 0);
  const labAttended = labSubjects.reduce((acc, s) => acc + s.attendedClasses, 0);
  const labAttendance = labTotal > 0 ? Math.round((labAttended / labTotal) * 100) : 0;
  
  const atRiskSubjects = subjects.filter(s => s.percentage < 75).length;

  return (
    <div className="min-h-screen bg-background">
      <Header student={student} onLogout={onLogout} />
      
      <main className="container px-4 py-6">
        {/* Welcome Section - Shows logged-in student's name */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-display text-foreground">
            Welcome back, {student.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            {student.department} • Semester {student.semester} • Roll No: {student.rollNumber}
          </p>
        </div>

        {/* Alert Banner if at risk */}
        {overallAttendance < 75 && totalClasses > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Attendance Alert!</p>
              <p className="text-sm text-destructive/80">
                Your attendance is below 75%. You need {Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25)} more classes to become eligible.
              </p>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {subjects.length === 0 && (
          <div className="mb-6 p-6 rounded-xl bg-muted/50 border border-border text-center">
            <p className="text-muted-foreground">No attendance data available yet. Your teachers will add your attendance records.</p>
          </div>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <AttendanceCard
            title="Overall Attendance"
            percentage={overallAttendance}
            subtitle="Combined classes & labs"
            icon={<Target className="w-5 h-5 text-primary" />}
          />
          <AttendanceCard
            title="Theory Classes"
            percentage={theoryAttendance}
            subtitle={`${theorySubjects.length} subjects`}
            icon={<BookOpen className="w-5 h-5 text-primary" />}
          />
          <AttendanceCard
            title="Lab Sessions"
            percentage={labAttendance}
            subtitle={`${labSubjects.length} labs`}
            icon={<FlaskConical className="w-5 h-5 text-secondary" />}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Classes"
            value={totalClasses}
            subtitle="This semester"
            icon={Calendar}
          />
          <StatsCard
            title="Attended"
            value={attendedClasses}
            subtitle={totalClasses > 0 ? `${Math.round((attendedClasses / totalClasses) * 100)}% of total` : '0% of total'}
            icon={TrendingUp}
            trend="up"
            trendValue="2.5%"
          />
          <StatsCard
            title="Missed"
            value={totalClasses - attendedClasses}
            subtitle="Classes missed"
            icon={AlertTriangle}
          />
          <StatsCard
            title="At Risk"
            value={atRiskSubjects}
            subtitle="Subjects below 75%"
            icon={AlertTriangle}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <AttendanceChart subjects={subjects} />
          </div>
          <div>
            <AttendancePieChart subjects={subjects} />
          </div>
        </div>

        {/* Subject Table and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SubjectTable subjects={subjects} />
          </div>
          <div>
            <RecentAttendance records={attendanceHistory} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-8 py-6">
        <div className="container px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Nizam College Attendance System. Maintain 75% attendance to be eligible for exams.
          </p>
        </div>
      </footer>
    </div>
  );
}
