import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, User, FileBarChart, BookOpen } from 'lucide-react';
import { Student } from '@/lib/mockData';
import { NotificationBell } from '@/components/NotificationBell';
import { RoleSwitcher } from '@/components/RoleSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
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
          <RoleSwitcher />
          <NotificationBell userId={userId} />

          <Button variant="ghost" size="icon" asChild title="My Subjects">
            <Link to="/subjects">
              <BookOpen className="w-5 h-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" asChild title="Attendance Report">
            <Link to="/report">
              <FileBarChart className="w-5 h-5" />
            </Link>
          </Button>
          
          <ThemeToggle />

          <Link
            to="/profile"
            title="My Profile"
            className="flex items-center gap-2 ml-1 rounded-full hover:bg-muted/60 transition-colors p-1 pr-2 md:pr-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition">
              {student.avatarUrl ? (
                <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium leading-tight">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
            </div>
          </Link>
          
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
