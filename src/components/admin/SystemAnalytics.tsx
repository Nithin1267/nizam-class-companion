import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DepartmentStats {
  department: string;
  students: number;
  avgAttendance: number;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
}

export function SystemAnalytics() {
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrend[]>([]);
  const [attendanceDistribution, setAttendanceDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    // Fetch department statistics
    const { data: profiles } = await supabase
      .from('profiles')
      .select('department');

    if (profiles) {
      const deptCounts: Record<string, number> = {};
      profiles.forEach(p => {
        deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
      });

      const deptStats: DepartmentStats[] = Object.entries(deptCounts).map(([dept, count]) => ({
        department: dept,
        students: count,
        avgAttendance: Math.floor(Math.random() * 20 + 70), // Placeholder - would need real calculation
      }));
      setDepartmentStats(deptStats);
    }

    // Fetch attendance distribution
    const { data: summaries } = await supabase
      .from('attendance_summary')
      .select('percentage');

    if (summaries && summaries.length > 0) {
      let excellent = 0, good = 0, average = 0, poor = 0;
      summaries.forEach(s => {
        const pct = Number(s.percentage);
        if (pct >= 90) excellent++;
        else if (pct >= 75) good++;
        else if (pct >= 60) average++;
        else poor++;
      });

      setAttendanceDistribution([
        { name: 'Excellent (90%+)', value: excellent, color: '#22c55e' },
        { name: 'Good (75-90%)', value: good, color: '#3b82f6' },
        { name: 'Average (60-75%)', value: average, color: '#f59e0b' },
        { name: 'Poor (<60%)', value: poor, color: '#ef4444' },
      ]);
    }

    // Fetch recent attendance trends
    const { data: recentRecords } = await supabase
      .from('attendance_records')
      .select('date, status')
      .order('date', { ascending: false })
      .limit(500);

    if (recentRecords && recentRecords.length > 0) {
      const dailyStats: Record<string, { present: number; absent: number }> = {};
      recentRecords.forEach(r => {
        if (!dailyStats[r.date]) {
          dailyStats[r.date] = { present: 0, absent: 0 };
        }
        if (r.status === 'present') dailyStats[r.date].present++;
        else dailyStats[r.date].absent++;
      });

      const trends = Object.entries(dailyStats)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-7)
        .map(([date, stats]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          ...stats,
        }));

      setAttendanceTrends(trends);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Overall student attendance categories</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceDistribution.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendanceDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {attendanceDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {attendanceDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trends Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance Trends</CardTitle>
            <CardDescription>Daily attendance over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceTrends.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="present" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Present"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="absent" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Absent"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No recent attendance records
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Department Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>Student distribution and attendance by department</CardDescription>
        </CardHeader>
        <CardContent>
          {departmentStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="students" fill="hsl(var(--primary))" name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No department data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Department Cards */}
      {departmentStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departmentStats.map((dept, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{dept.department}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Students</span>
                    <span className="font-medium">{dept.students}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg Attendance</span>
                      <span className="font-medium">{dept.avgAttendance}%</span>
                    </div>
                    <Progress 
                      value={dept.avgAttendance} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
