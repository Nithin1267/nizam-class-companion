import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Shield, GraduationCap, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const roleConfig = {
  student: { label: 'Student', icon: GraduationCap, path: '/dashboard', color: 'bg-blue-500' },
  teacher: { label: 'Teacher', icon: Users, path: '/teacher/dashboard', color: 'bg-green-500' },
  admin: { label: 'Admin', icon: Shield, path: '/admin', color: 'bg-purple-500' },
} as const;

type AppRole = 'admin' | 'teacher' | 'student';

export function RoleSwitcher() {
  const { role, availableRoles, switchRole } = useAuth();
  const navigate = useNavigate();

  if (!availableRoles || availableRoles.length <= 1) return null;

  const current = role ? roleConfig[role] : null;
  if (!current) return null;

  const CurrentIcon = current.icon;

  const handleSwitch = (newRole: AppRole) => {
    if (newRole === role) return;
    switchRole(newRole);
    navigate(roleConfig[newRole].path);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{current.label}</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {availableRoles.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {availableRoles.map((r) => {
          const config = roleConfig[r];
          const Icon = config.icon;
          const isActive = r === role;
          return (
            <DropdownMenuItem
              key={r}
              onClick={() => handleSwitch(r)}
              className={isActive ? 'bg-accent font-medium' : ''}
            >
              <div className={`w-2 h-2 rounded-full ${config.color} mr-2`} />
              <Icon className="w-4 h-4 mr-2" />
              {config.label}
              {isActive && <span className="ml-auto text-xs text-muted-foreground">Active</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
