import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Mail, Lock, ArrowRight, User, ClipboardCheck, Users, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const departments = [
  'Computer Science',
  'Electronics',
  'Mechanical',
  'Civil',
  'Electrical',
  'Mathematics',
  'Physics',
  'Chemistry',
];

export function TeacherAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Login failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/teacher/dashboard');
        }
      } else {
        const { error } = await signUp(email, password, 'teacher', name, { department });
        if (error) {
          toast({
            title: 'Signup failed',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Account created!',
            description: 'You can now sign in with your credentials.',
          });
          setIsLogin(true);
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(174 62% 35%) 0%, hsl(174 62% 25%) 50%, hsl(221 83% 30%) 100%)' }}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
        
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur">
              <GraduationCap className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display">Nizam College</h1>
              <p className="text-white/80">Teacher Portal</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold font-display leading-tight mb-6">
            Manage Your<br />
            <span className="text-primary-foreground">Classroom</span>
          </h2>

          <p className="text-lg text-white/80 mb-12 max-w-md">
            Track student attendance, send alerts, and manage your subjects all in one place.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Mark Attendance</p>
                <p className="text-sm text-white/70">Quick and easy attendance marking</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Student Overview</p>
                <p className="text-sm text-white/70">View attendance stats for all students</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-white/10 backdrop-blur">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Subject Management</p>
                <p className="text-sm text-white/70">Add and manage your subjects</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-20 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-float" />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="p-2.5 rounded-lg" style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">Nizam College</h1>
              <p className="text-xs text-muted-foreground">Teacher Portal</p>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-display">
              {isLogin ? 'Teacher Login' : 'Teacher Registration'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? 'Sign in to manage your classes' : 'Create a new teacher account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment} required>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-secondary hover:underline font-medium"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <div className="mt-6 text-center">
            <a href="/student" className="text-sm text-muted-foreground hover:text-secondary">
              ← Back to Student Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
