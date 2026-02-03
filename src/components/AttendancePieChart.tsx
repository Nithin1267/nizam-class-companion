import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Subject } from '@/lib/mockData';

interface AttendancePieChartProps {
  subjects?: Subject[];
}

export function AttendancePieChart({ subjects = [] }: AttendancePieChartProps) {
  const theorySubjects = subjects.filter(s => s.type === 'theory');
  const labSubjects = subjects.filter(s => s.type === 'lab');

  const theoryAttended = theorySubjects.reduce((acc, s) => acc + s.attendedClasses, 0);
  const theoryTotal = theorySubjects.reduce((acc, s) => acc + s.totalClasses, 0);
  
  const labAttended = labSubjects.reduce((acc, s) => acc + s.attendedClasses, 0);
  const labTotal = labSubjects.reduce((acc, s) => acc + s.totalClasses, 0);

  const data = [
    { name: 'Theory Present', value: theoryAttended, color: 'hsl(221, 83%, 30%)' },
    { name: 'Theory Absent', value: theoryTotal - theoryAttended, color: 'hsl(221, 83%, 70%)' },
    { name: 'Lab Present', value: labAttended, color: 'hsl(174, 62%, 47%)' },
    { name: 'Lab Absent', value: labTotal - labAttended, color: 'hsl(174, 62%, 75%)' },
  ];

  if (subjects.length === 0) {
    return (
      <div className="elevated-card rounded-xl p-6 animate-fade-in">
        <div className="mb-4">
          <h3 className="text-lg font-semibold font-display">Attendance Distribution</h3>
          <p className="text-sm text-muted-foreground mt-1">No attendance data available</p>
        </div>
        <div className="h-[280px] flex items-center justify-center text-muted-foreground">
          Distribution chart will appear here
        </div>
      </div>
    );
  }

  return (
    <div className="elevated-card rounded-xl p-6 animate-fade-in">
      <div className="mb-4">
        <h3 className="text-lg font-semibold font-display">Attendance Distribution</h3>
        <p className="text-sm text-muted-foreground mt-1">Classes attended vs missed</p>
      </div>

      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
              formatter={(value: number) => [value, 'Classes']}
            />
            <Legend 
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              iconSize={8}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{theoryAttended}/{theoryTotal}</p>
          <p className="text-xs text-muted-foreground">Theory Classes</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-secondary">{labAttended}/{labTotal}</p>
          <p className="text-xs text-muted-foreground">Lab Sessions</p>
        </div>
      </div>
    </div>
  );
}
