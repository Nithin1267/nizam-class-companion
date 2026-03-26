import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CalendarIcon, Download, FileSpreadsheet, FileText, Filter, Loader2, BookOpen, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subMonths, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  subject_id: string;
  subjects: { name: string; code: string; type: string } | null;
}

interface SummaryRow {
  subject_id: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
  subjects: { name: string; code: string; type: string } | null;
}

export default function AttendanceReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 3));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [profileName, setProfileName] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [recordsRes, summaryRes, profileRes] = await Promise.all([
      supabase
        .from('attendance_records')
        .select('id, date, status, subject_id, subjects(name, code, type)')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('attendance_summary')
        .select('subject_id, total_classes, attended_classes, percentage, subjects(name, code, type)')
        .eq('user_id', user.id),
      supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single(),
    ]);

    if (recordsRes.data) setRecords(recordsRes.data as any);
    if (summaryRes.data) setSummary(summaryRes.data as any);
    if (profileRes.data) setProfileName(profileRes.data.name);
    setLoading(false);
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const d = parseISO(r.date);
      const inRange = isWithinInterval(d, { start: startDate, end: endDate });
      const matchSubject = subjectFilter === 'all' || r.subject_id === subjectFilter;
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return inRange && matchSubject && matchStatus;
    });
  }, [records, startDate, endDate, subjectFilter, statusFilter]);

  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((r) => {
      if (r.subjects?.name) map.set(r.subject_id, r.subjects.name);
    });
    return Array.from(map.entries());
  }, [records]);

  // Daily trend data
  const dailyTrend = useMemo(() => {
    const dayMap: Record<string, { present: number; absent: number }> = {};
    filteredRecords.forEach((r) => {
      if (!dayMap[r.date]) dayMap[r.date] = { present: 0, absent: 0 };
      if (r.status === 'present') dayMap[r.date].present++;
      else dayMap[r.date].absent++;
    });
    return Object.entries(dayMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, stats]) => ({
        date: format(parseISO(date), 'MMM d'),
        ...stats,
      }));
  }, [filteredRecords]);

  // Subject-wise breakdown for bar chart
  const subjectBreakdown = useMemo(() => {
    return summary.map((s) => ({
      name: s.subjects?.name || 'Unknown',
      code: s.subjects?.code || '',
      attended: s.attended_classes,
      missed: s.total_classes - s.attended_classes,
      percentage: s.percentage,
    }));
  }, [summary]);

  // Status distribution for pie chart
  const statusDistribution = useMemo(() => {
    const present = filteredRecords.filter((r) => r.status === 'present').length;
    const absent = filteredRecords.filter((r) => r.status !== 'present').length;
    return [
      { name: 'Present', value: present, color: 'hsl(var(--chart-2))' },
      { name: 'Absent', value: absent, color: 'hsl(var(--chart-5))' },
    ];
  }, [filteredRecords]);

  const totalFiltered = filteredRecords.length;
  const presentFiltered = filteredRecords.filter((r) => r.status === 'present').length;
  const filteredPercentage = totalFiltered > 0 ? Math.round((presentFiltered / totalFiltered) * 100) : 0;

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      const summaryData = summary.map((s) => ({
        Subject: s.subjects?.name || 'Unknown',
        Code: s.subjects?.code || 'N/A',
        Type: s.subjects?.type || 'theory',
        'Total Classes': s.total_classes,
        Attended: s.attended_classes,
        'Percentage (%)': s.percentage,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');

      const recordsData = filteredRecords.map((r) => ({
        Date: r.date,
        Subject: r.subjects?.name || 'Unknown',
        Code: r.subjects?.code || 'N/A',
        Status: r.status,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recordsData), 'Records');

      XLSX.writeFile(wb, `Attendance_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      toast.success('Excel report downloaded!');
    } catch {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-display">Attendance Report</h1>
              <p className="text-sm text-muted-foreground">{profileName} • Detailed attendance analysis</p>
            </div>
          </div>
          <Button onClick={exportToExcel} disabled={exporting} size="sm" className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start text-left text-xs">
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {format(startDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[140px] justify-start text-left text-xs">
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {format(endDate, 'MMM d, yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} /></PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Subject</label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {uniqueSubjects.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{totalFiltered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-2xl font-bold text-chart-2">{presentFiltered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold text-chart-5">{totalFiltered - presentFiltered}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">Attendance %</p>
              <p className={cn('text-2xl font-bold', filteredPercentage >= 75 ? 'text-chart-2' : 'text-destructive')}>
                {filteredPercentage}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Daily Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Trend</CardTitle>
              <CardDescription>Daily present vs absent (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyTrend.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="present" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="hsl(var(--chart-5))" strokeWidth={2} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data for selected range</p>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {totalFiltered > 0 ? (
                <div className="h-56 flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value">
                        {statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4">
                    {statusDistribution.map((item, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}: {item.value}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Breakdown */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject-wise Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectBreakdown.length > 0 ? (
              <div className="space-y-3">
                {subjectBreakdown.map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-40 min-w-[100px]">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.code}</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={s.percentage} className="h-2.5" />
                    </div>
                    <div className="w-20 text-right">
                      <span className={cn('text-sm font-semibold', s.percentage >= 75 ? 'text-chart-2' : 'text-destructive')}>
                        {s.percentage}%
                      </span>
                      <p className="text-[10px] text-muted-foreground">{s.attended}/{s.attended + s.missed}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No summary data available</p>
            )}
          </CardContent>
        </Card>

        {/* Full Records Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detailed Records</CardTitle>
            <CardDescription>{filteredRecords.length} records found</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRecords.length > 0 ? (
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRecords.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{format(parseISO(r.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-sm">{r.subjects?.name || 'Unknown'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.subjects?.code || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'present' ? 'default' : 'destructive'} className="text-xs gap-1">
                            {r.status === 'present' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {r.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No records match your filters</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
