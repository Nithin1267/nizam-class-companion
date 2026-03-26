import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'teacher' | 'student';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  availableRoles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: AppRole, name: string, additionalData?: Record<string, any>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  switchRole: (newRole: AppRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } else {
        setRole(data?.role as AppRole ?? null);
      }
    } catch (err) {
      console.error('Error fetching role:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    signUpRole: AppRole,
    name: string,
    additionalData?: Record<string, any>
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const requestedRollNumber = String(
      additionalData?.rollNumber || `${signUpRole.toUpperCase()}-${Date.now()}`
    ).trim();
    const requestedDepartment = String(
      additionalData?.department || 'Computer Science'
    ).trim();
    const parsedSemester = Number(additionalData?.semester ?? 1);
    const requestedSemester = Number.isInteger(parsedSemester) && parsedSemester > 0 ? parsedSemester : 1;

    if (signUpRole === 'student') {
      const { data: rollAvailable, error: rollCheckError } = await (supabase as any).rpc(
        'is_roll_number_available',
        { p_roll_number: requestedRollNumber }
      );

      if (rollCheckError) {
        console.error('Error checking roll number availability:', rollCheckError);
        return { error: new Error('Unable to validate roll number right now. Please try again.') };
      }

      if (!rollAvailable) {
        return {
          error: new Error(
            'This roll number is already registered. Please sign in with your existing account or contact your teacher/admin.'
          ),
        };
      }
    }

    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          signup_as_teacher: signUpRole === 'teacher' ? 'true' : 'false',
        },
      },
    });

    if (error) {
      if (error.message?.toLowerCase().includes('user already registered')) {
        return {
          error: new Error('This email is already registered. Please sign in or reset your password.'),
        };
      }
      return { error };
    }

    if (!data.user) {
      return { error: new Error('Account creation failed. Please try again.') };
    }

    const { data: profileResult, error: profileError } = await (supabase as any).rpc(
      'finalize_user_profile',
      {
        p_user_id: data.user.id,
        p_email: normalizedEmail,
        p_name: normalizedName,
        p_roll_number: requestedRollNumber,
        p_department: requestedDepartment,
        p_semester: requestedSemester,
      }
    );

    if (profileError) {
      console.error('Error creating profile:', profileError);
      await supabase.auth.signOut();
      return { error: new Error('Unable to create your profile right now. Please try again.') };
    }

    if (!profileResult?.ok) {
      await supabase.auth.signOut();
      return {
        error: new Error(
          profileResult?.message || 'Unable to complete signup. Please verify your details and try again.'
        ),
      };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
