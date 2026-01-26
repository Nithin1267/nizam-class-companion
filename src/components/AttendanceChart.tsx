import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { getMonthlyData } from '@/lib/mockData';

export function AttendanceChart() {
  const data = getMonthlyData();

  return (
    <div className="elevated-card rounded-xl p-6 animate-fade-in">
      <div className="mb-6">
        <h3 className="text-lg font-semibold font-display">Attendance Trend</h3>
        <p className="text-sm text-muted-foreground mt-1">Monthly attendance percentage for classes and labs</p>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              dataKey="month" 
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
              domain={[50, 100]}
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
            />
            <Area
              type="monotone"
              dataKey="labs"
              name="Lab Sessions"
              stroke="hsl(174, 62%, 47%)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorLabs)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
