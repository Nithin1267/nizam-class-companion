import { Subject } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { BookOpen, FlaskConical } from 'lucide-react';

interface SubjectTableProps {
  subjects: Subject[];
}

export function SubjectTable({ subjects }: SubjectTableProps) {
  const getStatusBadge = (percentage: number) => {
    if (percentage >= 75) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
          Safe
        </span>
      );
    }
    if (percentage >= 65) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
          Warning
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
        Critical
      </span>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 65) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="elevated-card rounded-xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border">
        <h3 className="text-lg font-semibold font-display">Subject-wise Attendance</h3>
        <p className="text-sm text-muted-foreground mt-1">Track your attendance for each subject</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subject</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Attended</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Progress</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr 
                key={subject.id} 
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="p-4">
                  <div>
                    <p className="font-medium text-foreground">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                    subject.type === 'theory' ? 'bg-primary/10 text-primary' : 'bg-secondary/20 text-secondary'
                  )}>
                    {subject.type === 'theory' ? (
                      <BookOpen className="w-3 h-3" />
                    ) : (
                      <FlaskConical className="w-3 h-3" />
                    )}
                    {subject.type === 'theory' ? 'Theory' : 'Lab'}
                  </div>
                </td>
                <td className="p-4">
                  <span className="text-sm font-medium">
                    {subject.attendedClasses} / {subject.totalClasses}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', getProgressColor(subject.percentage))}
                        style={{ width: `${subject.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold min-w-[45px]">
                      {subject.percentage.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  {getStatusBadge(subject.percentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
