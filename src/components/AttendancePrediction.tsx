import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Target } from "lucide-react";
import { Subject } from "@/lib/mockData";

interface AttendancePredictionProps {
  subjects: Subject[];
  targetPercentage?: number;
}

export function AttendancePrediction({
  subjects,
  targetPercentage = 75,
}: AttendancePredictionProps) {
  const calculateClassesNeeded = (subject: Subject) => {
    const { totalClasses, attendedClasses, percentage } = subject;
    
    if (percentage >= targetPercentage) {
      // Already above target - calculate how many can be missed
      // (attended) / (total + x) >= target/100
      // attended >= target * (total + x) / 100
      // x <= (attended * 100 / target) - total
      const canMiss = Math.floor((attendedClasses * 100) / targetPercentage - totalClasses);
      return { status: "safe", canMiss: Math.max(0, canMiss), needed: 0 };
    }
    
    // Below target - calculate classes needed
    // (attended + x) / (total + x) >= target/100
    // attended + x >= target * (total + x) / 100
    // x * (1 - target/100) >= target * total / 100 - attended
    // x >= (target * total / 100 - attended) / (1 - target/100)
    const numerator = (targetPercentage * totalClasses) / 100 - attendedClasses;
    const denominator = 1 - targetPercentage / 100;
    const needed = Math.ceil(numerator / denominator);
    
    return { status: "at-risk", canMiss: 0, needed: Math.max(0, needed) };
  };

  const predictions = subjects.map((subject) => ({
    subject,
    prediction: calculateClassesNeeded(subject),
  }));

  const safeSubjects = predictions.filter((p) => p.prediction.status === "safe");
  const atRiskSubjects = predictions.filter((p) => p.prediction.status === "at-risk");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Attendance Predictions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Target: {targetPercentage}% attendance
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No subjects to analyze
          </p>
        ) : (
          <>
            {/* At Risk Subjects */}
            {atRiskSubjects.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Needs Attention</span>
                </div>
                {atRiskSubjects.map(({ subject, prediction }) => (
                  <div
                    key={subject.id}
                    className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {subject.percentage}%
                        </p>
                      </div>
                      <Badge variant="destructive">
                        Need {prediction.needed} more
                      </Badge>
                    </div>
                    <Progress
                      value={subject.percentage}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Attend {prediction.needed} consecutive classes to reach {targetPercentage}%
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Safe Subjects */}
            {safeSubjects.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">On Track</span>
                </div>
                {safeSubjects.map(({ subject, prediction }) => (
                  <div
                    key={subject.id}
                    className="p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {subject.percentage}%
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-600 border-green-500/20"
                      >
                        Can miss {prediction.canMiss}
                      </Badge>
                    </div>
                    <Progress
                      value={subject.percentage}
                      className="h-2 [&>div]:bg-green-500"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      You can miss up to {prediction.canMiss} classes and stay above {targetPercentage}%
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
