import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, User, Settings } from 'lucide-react';
import { Student } from '@/lib/mockData';
import { NotificationBell } from '@/components/NotificationBell';
import { Link } from 'react-router-dom';

interface HeaderProps {
  student: Student;
  userId: string;
  onLogout: () => void;
}

export function Header({ student, userId, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="hero-gradient p-2 rounded-lg">
            <GraduationCap className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Nizam College</h1>
            <p className="text-xs text-muted-foreground">Attendance Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell userId={userId} />
          
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile">
              <Settings className="w-5 h-5" />
            </Link>
          </Button>
          
          <div className="hidden md:flex items-center gap-2 text-right ml-2">
            <div>
              <p className="text-sm font-medium">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
