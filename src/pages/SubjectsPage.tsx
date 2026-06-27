import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Subject, Student } from '@/lib/mockData';
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Target,
} from 'lucide-react';

const TARGET = 75;

function computePrediction(s: Subject) {
  if (s.totalClasses === 0) {
    return { status: 'no-data' as const, needed: 0, canMiss: 0 };
  }
  if (s.percentage >= TARGET) {
    const canMiss = Math.floor((s.attendedClasses * 100) / TARGET - s.totalClasses);
    return { status: 'safe' as const, needed: 0, canMiss: Math.max(0, canMiss) };
  }
  const needed = Math.ceil(
    ((TARGET * s.totalClasses) / 100 - s.attendedClasses) / (1 - TARGET / 100),
  );
  return { status: 'at-risk' as const, needed: Math.max(0, needed), canMiss: 0 };
}

export default function SubjectsPage() {
  const { user, signOut } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile) {
        setStudent({
          id: profile.user_id,
          name: profile.name,
          rollNumber: profile.roll_number,
          email: profile.email,
          department: profile.department,
          semester: profile.semester,
        });
      }
      const { data: summary } = await supabase
        .from('attendance_summary')
        .select('*, subjects(name, code, type)')
        .eq('user_id', user.id);
      if (summary) {
        setSubjects(
          summary.map((row: any) => ({
            id: row.subject_id,
            name: row.subjects?.name || 'Unknown',
            code: row.subjects?.code || 'N/A',
            type: (row.subjects?.type || 'theory') as 'theory' | 'lab',
            totalClasses: row.total_classes,
            attendedClasses: row.attended_classes,
            percentage: Number(row.percentage),
          })),
        );
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading || !student || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const enriched = subjects
    .map((s) => ({ subject: s, prediction: computePrediction(s) }))
    .sort((a, b) => a.subject.percentage - b.subject.percentage);

  const atRisk = enriched.filter((e) => e.prediction.status === 'at-risk');
  const safe = enriched.filter((e) => e.prediction.status === 'safe');
  const noData = enriched.filter((e) => e.prediction.status === 'no-data');

  const totalNeeded = atRisk.reduce((acc, e) => acc + e.prediction.needed, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header student={student} userId={user.id} onLogout={signOut} />

      <main className="container px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Link>
            </Button>
            <h2 className="text-2xl font-bold font-display">My Subjects</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Classes needed per subject to reach the 75% attendance threshold
            </p>
          </div>
        </div>

        {/* Summary banner */}
        <Card className="mb-6">
          <CardContent className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Total Subjects" value={subjects.length} />
            <Stat label="On Track" value={safe.length} tone="success" />
            <Stat label="At Risk" value={atRisk.length} tone="danger" />
            <Stat
              label="Total Classes Needed"
              value={totalNeeded}
              tone={totalNeeded > 0 ? 'danger' : 'success'}
            />
          </CardContent>
        </Card>

        {/* At-risk subjects */}
        {atRisk.length > 0 && (
          <Section
            title="Needs Attention"
            icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {atRisk.map(({ subject, prediction }) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  prediction={prediction}
                />
              ))}
            </div>
          </Section>
        )}

        {/* Safe subjects */}
        {safe.length > 0 && (
          <Section
            title="On Track"
            icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              {safe.map(({ subject, prediction }) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  prediction={prediction}
                />
              ))}
            </div>
          </Section>
        )}

        {noData.length > 0 && (
          <Section title="No Data Yet" icon={<Target className="w-5 h-5 text-muted-foreground" />}>
            <div className="grid gap-4 md:grid-cols-2">
              {noData.map(({ subject }) => (
                <Card key={subject.id}>
                  <CardContent className="p-4">
                    <p className="font-medium">{subject.name}</p>
                    <p className="text-xs text-muted-foreground">{subject.code}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      No attendance recorded yet.
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {subjects.length === 0 && (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              No subjects assigned yet. Once teachers start marking attendance,
              your subjects will appear here.
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t border-border mt-8 py-6">
        <div className="container px-4 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Nizam College | Osmania University
          </p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'success' | 'danger';
}) {
  const color =
    tone === 'success'
      ? 'text-success'
      : tone === 'danger'
      ? 'text-destructive'
      : 'text-foreground';
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-lg font-semibold font-display">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SubjectCard({
  subject,
  prediction,
}: {
  subject: Subject;
  prediction: ReturnType<typeof computePrediction>;
}) {
  const isSafe = prediction.status === 'safe';
  const TypeIcon = subject.type === 'lab' ? FlaskConical : BookOpen;

  return (
    <Card
      className={
        isSafe
          ? 'border-success/30 bg-success/5'
          : 'border-destructive/30 bg-destructive/5'
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TypeIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{subject.name}</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {subject.code} • {subject.type === 'lab' ? 'Lab' : 'Theory'}
            </p>
          </div>
          <Badge
            variant={isSafe ? 'outline' : 'destructive'}
            className={isSafe ? 'bg-success/10 text-success border-success/30' : ''}
          >
            {subject.percentage.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>
              Attended {subject.attendedClasses} of {subject.totalClasses}
            </span>
            <span>Target {TARGET}%</span>
          </div>
          <Progress value={subject.percentage} className="h-2" />
        </div>

        {prediction.status === 'at-risk' ? (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Attend next {prediction.needed}{' '}
              {prediction.needed === 1 ? 'class' : 'classes'} in a row
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This will bring you to {TARGET}% attendance for this subject.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm font-medium text-success flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              You can miss up to {prediction.canMiss}{' '}
              {prediction.canMiss === 1 ? 'class' : 'classes'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              And still stay above the {TARGET}% threshold.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}