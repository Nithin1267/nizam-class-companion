import { Header } from '@/components/Header';
import { AttendanceCard } from '@/components/AttendanceCard';
import { SubjectTable } from '@/components/SubjectTable';
import { AttendanceChart } from '@/components/AttendanceChart';
import { AttendancePieChart } from '@/components/AttendancePieChart';
import { RecentAttendance } from '@/components/RecentAttendance';
import { StatsCard } from '@/components/StatsCard';
import { 
  mockStudent, 
  mockSubjects, 
  mockAttendanceHistory,
  getOverallAttendance,
  getTheoryAttendance,
  getLabAttendance 
} from '@/lib/mockData';
import { BookOpen, FlaskConical, Target, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const overallAttendance = getOverallAttendance();
  const theoryAttendance = getTheoryAttendance();
  const labAttendance = getLabAttendance();
  
  const atRiskSubjects = mockSubjects.filter(s => s.percentage < 75).length;
  const totalClasses = mockSubjects.reduce((acc, s) => acc + s.totalClasses, 0);
  const attendedClasses = mockSubjects.reduce((acc, s) => acc + s.attendedClasses, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header student={mockStudent} onLogout={onLogout} />
      
      <main className="container px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-display text-foreground">
            Welcome back, {mockStudent.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            {mockStudent.department} • Semester {mockStudent.semester}
          </p>
        </div>

        {/* Alert Banner if at risk */}
        {overallAttendance < 75 && (
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
            subtitle={`${mockSubjects.filter(s => s.type === 'theory').length} subjects`}
            icon={<BookOpen className="w-5 h-5 text-primary" />}
          />
          <AttendanceCard
            title="Lab Sessions"
            percentage={labAttendance}
            subtitle={`${mockSubjects.filter(s => s.type === 'lab').length} labs`}
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
            subtitle={`${((attendedClasses / totalClasses) * 100).toFixed(0)}% of total`}
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
            <AttendanceChart />
          </div>
          <div>
            <AttendancePieChart />
          </div>
        </div>

        {/* Subject Table and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SubjectTable subjects={mockSubjects} />
          </div>
          <div>
            <RecentAttendance records={mockAttendanceHistory} />
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
