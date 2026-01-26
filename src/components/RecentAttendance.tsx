import { AttendanceRecord } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Calendar } from 'lucide-react';

interface RecentAttendanceProps {
  records: AttendanceRecord[];
}

export function RecentAttendance({ records }: RecentAttendanceProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="elevated-card rounded-xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        <div>
          <h3 className="text-lg font-semibold font-display">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">Your latest attendance records</p>
        </div>
      </div>
      
      <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
        {records.map((record, index) => (
          <div 
            key={`${record.date}-${record.subject}-${index}`}
            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-full',
                record.status === 'present' ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {record.status === 'present' ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{record.subject}</p>
                <p className="text-xs text-muted-foreground">{formatDate(record.date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                'px-2 py-0.5 rounded text-xs font-medium',
                record.type === 'theory' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary'
              )}>
                {record.type === 'theory' ? 'Theory' : 'Lab'}
              </span>
              <span className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                record.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}>
                {record.status === 'present' ? 'Present' : 'Absent'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
