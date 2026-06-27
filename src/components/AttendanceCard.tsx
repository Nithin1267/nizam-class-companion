import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AttendanceCardProps {
  title: string;
  percentage: number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
  totalClasses?: number;
  attendedClasses?: number;
}

export function AttendanceCard({
  title,
  percentage,
  subtitle,
  icon,
  className,
  totalClasses,
  attendedClasses,
}: AttendanceCardProps) {
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

  const isSafe = percentage >= 75;

  // Compute "must attend next N" hint when totals provided and below threshold.
  let classesNeeded: number | null = null;
  if (
    !isSafe &&
    typeof totalClasses === 'number' &&
    typeof attendedClasses === 'number' &&
    totalClasses > 0
  ) {
    // (attended + x) / (total + x) >= 0.75  ⇒  x >= (0.75*total - attended) / 0.25
    const needed = Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25);
    classesNeeded = Math.max(0, needed);
  }

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
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 mb-1.5',
            isSafe
              ? 'bg-success/15 text-success'
              : 'bg-destructive/15 text-destructive',
          )}
        >
          {isSafe ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          {isSafe ? 'Eligible' : 'At Risk'}
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

      {classesNeeded !== null && classesNeeded > 0 && (
        <p className="mt-3 text-xs text-destructive flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            You must attend the next <strong>{classesNeeded}</strong> classes to
            maintain 75% attendance.
          </span>
        </p>
      )}
    </div>
  );
}
