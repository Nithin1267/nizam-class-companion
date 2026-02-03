import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { Subject } from '@/lib/mockData';

interface AttendanceChartProps {
  subjects?: Subject[];
}

export function AttendanceChart({ subjects = [] }: AttendanceChartProps) {
  // Generate monthly data based on real attendance if available
  // For now, we'll show subject-based data since we don't have monthly historical data
  const theorySubjects = subjects.filter(s => s.type === 'theory');
  const labSubjects = subjects.filter(s => s.type === 'lab');

  // Create data points for each subject
  const data = subjects.length > 0 
    ? subjects.map(s => ({
        name: s.code,
        classes: s.type === 'theory' ? s.percentage : null,
        labs: s.type === 'lab' ? s.percentage : null,
      }))
    : [];

  // Group by subject for better visualization
  const chartData = theorySubjects.map((theory, index) => {
    const lab = labSubjects[index];
    return {
      name: theory.code.replace(/L?$/, ''),
      classes: theory.percentage,
      labs: lab?.percentage || 0,
    };
  });

  // If no matching pairs, show all subjects
  const finalData = chartData.length > 0 ? chartData : subjects.map(s => ({
    name: s.code,
    classes: s.type === 'theory' ? s.percentage : 0,
    labs: s.type === 'lab' ? s.percentage : 0,
  }));

  if (subjects.length === 0) {
    return (
      <div className="elevated-card rounded-xl p-6 animate-fade-in">
        <div className="mb-6">
          <h3 className="text-lg font-semibold font-display">Attendance Trend</h3>
          <p className="text-sm text-muted-foreground mt-1">No attendance data available yet</p>
        </div>
        <div className="h-[300px] flex items-center justify-center text-muted-foreground">
          Attendance data will appear here once recorded
        </div>
      </div>
    );
  }

  return (
    <div className="elevated-card rounded-xl p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-display">Attendance by Subject</h3>
        <p className="text-sm text-muted-foreground mt-1">Attendance percentage for classes and labs</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={finalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorClasses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(221, 83%, 30%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(221, 83%, 30%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLabs" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(174, 62%, 47%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number) => [`${value}%`, '']}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <ReferenceLine 
              y={75} 
              stroke="hsl(var(--warning))" 
              strokeDasharray="5 5"
              label={{ 
                value: '75% Threshold', 
                position: 'right',
                fill: 'hsl(var(--warning))',
                fontSize: 11
              }}
            />
            <Area
              type="monotone"
              dataKey="classes"
              name="Theory Classes"
              stroke="hsl(221, 83%, 30%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClasses)"
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="labs"
              name="Lab Sessions"
              stroke="hsl(174, 62%, 47%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLabs)"
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
