import { cn } from '@/lib/utils';

interface AttendanceCardProps {
  title: string;
  percentage: number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function AttendanceCard({ title, percentage, subtitle, icon, className }: AttendanceCardProps) {
  const getStatusColor = (percent: number) => {
    if (percent >= 75) return 'text-success';
    if (percent >= 65) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 75) return 'bg-success';
    if (percent >= 65) return 'bg-warning';
    return 'bg-destructive';
  };

  const getStatusBg = (percent: number) => {
    if (percent >= 75) return 'bg-success/10';
    if (percent >= 65) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  return (
    <div className={cn('elevated-card rounded-xl p-6 animate-fade-in', className)}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className={cn('p-2 rounded-lg', getStatusBg(percentage))}>
            {icon}
          </div>
        )}
      </div>
      
      <div className="flex items-end gap-2 mb-3">
        <span className={cn('text-4xl font-bold font-display', getStatusColor(percentage))}>
          {percentage}%
        </span>
        <span className="text-sm text-muted-foreground mb-1">
          {percentage >= 75 ? 'Eligible' : 'At Risk'}
        </span>
      </div>

      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getProgressColor(percentage))}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>0%</span>
        <span className="text-warning font-medium">75% Required</span>
        <span>100%</span>
      </div>
    </div>
  );
}
