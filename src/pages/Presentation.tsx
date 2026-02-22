import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize, Minimize, Home, GraduationCap, Database, Shield, Users, BookOpen, BarChart3, Bell, ClipboardCheck, Smartphone, Code, Layers, CheckCircle, ArrowRight } from 'lucide-react';

const TOTAL_SLIDES = 12;

export default function Presentation() {
  const [current, setCurrent] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();

  const next = useCallback(() => setCurrent(c => Math.min(c + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      if (e.key === 'Escape') setFullscreen(false);
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setFullscreen(f => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  useEffect(() => {
    if (fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  }, [fullscreen]);

  useEffect(() => {
    const handler = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const slides = [
    <TitleSlide key={0} />,
    <IntroSlide key={1} />,
    <ProblemSlide key={2} />,
    <SolutionSlide key={3} />,
    <ArchitectureSlide key={4} />,
    <TechStackSlide key={5} />,
    <FeaturesStudentSlide key={6} />,
    <FeaturesTeacherSlide key={7} />,
    <FeaturesAdminSlide key={8} />,
    <DatabaseSlide key={9} />,
    <ScreenshotsSlide key={10} />,
    <ConclusionSlide key={11} />,
  ];

  return (
    <div className={`${fullscreen ? 'fixed inset-0 z-[9999]' : 'min-h-screen'} bg-[#0a0e27] flex flex-col items-center justify-center select-none`}>
      {/* Slide Container */}
      <div className="relative w-full max-w-[960px] aspect-video overflow-hidden rounded-2xl shadow-2xl border border-white/10">
        {slides[current]}

        {/* Slide Number */}
        <div className="absolute bottom-4 right-6 text-white/40 text-sm font-mono">
          {current + 1} / {TOTAL_SLIDES}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition">
          <Home className="w-5 h-5" />
        </button>
        <button onClick={prev} disabled={current === 0} className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Progress dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === current ? 'bg-cyan-400 scale-125' : i < current ? 'bg-cyan-400/40' : 'bg-white/20'}`}
            />
          ))}
        </div>

        <button onClick={next} disabled={current === TOTAL_SLIDES - 1} className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 disabled:opacity-30 transition">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={() => setFullscreen(f => !f)} className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition">
          {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>

      <p className="text-white/30 text-xs mt-3">Use ← → arrow keys or click to navigate · Press F for fullscreen</p>
    </div>
  );
}

/* ═══════════════════════════ SLIDE COMPONENTS ═══════════════════════════ */

function SlideLayout({ children, gradient = 'from-[#0f1642] to-[#0a0e27]' }: { children: React.ReactNode; gradient?: string }) {
  return (
    <div className={`w-full h-full absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col justify-center px-16 py-12 overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl" />
      {children}
    </div>
  );
}

function TitleSlide() {
  return (
    <SlideLayout gradient="from-[#0a1628] via-[#0f1f4b] to-[#0d2e4a]">
      <div className="flex flex-col items-center justify-center text-center h-full relative z-10">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6 shadow-lg shadow-cyan-500/20">
          <GraduationCap className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Student Attendance
        </h1>
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Management System
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6" />
        <p className="text-xl text-blue-200/80 mb-2">Nizam College (Autonomous)</p>
        <p className="text-blue-300/50 text-sm">Osmania University, Hyderabad</p>
        <div className="mt-10 px-6 py-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-blue-200/60 text-sm">Department of Computer Science · 2024-25</p>
        </div>
      </div>
    </SlideLayout>
  );
}

function IntroSlide() {
  return (
    <SlideLayout>
      <SectionHeader icon={<BookOpen />} title="Project Introduction" />
      <div className="grid grid-cols-2 gap-6 mt-6">
        <InfoCard title="Objective" text="Build a comprehensive web-based attendance tracking system that replaces manual registers with a digital, real-time solution." />
        <InfoCard title="Scope" text="Multi-role platform supporting Students, Teachers, and Administrators with role-based access and dashboards." />
        <InfoCard title="Key Goals" text="Automate attendance marking, provide analytics & predictions, enable alerts for low attendance, and offer data export." />
        <InfoCard title="Target Users" text="Nizam College students and faculty — designed for scalability across departments and semesters." />
      </div>
    </SlideLayout>
  );
}

function ProblemSlide() {
  return (
    <SlideLayout gradient="from-[#1a0a0a] to-[#0a0e27]">
      <SectionHeader icon={<Bell />} title="Problem Statement" color="rose" />
      <div className="space-y-4 mt-6">
        {[
          'Manual attendance registers are error-prone and time-consuming',
          'Students lack real-time visibility into their attendance percentage',
          'No automated alerts when attendance drops below required thresholds (75%)',
          'Difficult to generate reports and analytics from paper records',
          'No centralized system for teachers to manage multiple subjects',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl px-5 py-3 border border-rose-500/10">
            <span className="text-rose-400 font-bold mt-0.5">{i + 1}.</span>
            <p className="text-blue-100/80 text-[15px]">{item}</p>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}

function SolutionSlide() {
  return (
    <SlideLayout gradient="from-[#041a1a] to-[#0a0e27]">
      <SectionHeader icon={<CheckCircle />} title="Our Solution" color="emerald" />
      <div className="grid grid-cols-3 gap-5 mt-6">
        {[
          { icon: <ClipboardCheck className="w-7 h-7" />, title: 'Digital Attendance', desc: 'Mark attendance with a few clicks — individually or via bulk CSV import' },
          { icon: <BarChart3 className="w-7 h-7" />, title: 'Live Analytics', desc: 'Real-time charts, pie graphs, and attendance predictions for students' },
          { icon: <Bell className="w-7 h-7" />, title: 'Smart Alerts', desc: 'Automated notifications when attendance falls below 75% threshold' },
          { icon: <Users className="w-7 h-7" />, title: 'Role-Based Access', desc: 'Separate dashboards for Students, Teachers, and Administrators' },
          { icon: <Shield className="w-7 h-7" />, title: 'Secure Auth', desc: 'Email-based authentication with password recovery and role verification' },
          { icon: <Smartphone className="w-7 h-7" />, title: 'Responsive UI', desc: 'Works seamlessly on desktop, tablet, and mobile devices' },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-5 border border-emerald-500/10 flex flex-col gap-2">
            <div className="text-emerald-400">{item.icon}</div>
            <h3 className="text-white font-semibold text-sm">{item.title}</h3>
            <p className="text-blue-200/60 text-xs leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}

function ArchitectureSlide() {
  return (
    <SlideLayout>
      <SectionHeader icon={<Layers />} title="System Architecture" />
      <div className="flex flex-col items-center mt-6 gap-3">
        {[
          { label: 'Frontend (React + Vite + Tailwind CSS)', color: 'from-cyan-500 to-blue-500' },
          { label: 'State Management (React Query + React Hooks)', color: 'from-blue-500 to-indigo-500' },
          { label: 'Backend (Lovable Cloud — Auth, Database, Functions)', color: 'from-indigo-500 to-purple-500' },
          { label: 'Database (PostgreSQL — RLS Policies)', color: 'from-purple-500 to-pink-500' },
        ].map((layer, i) => (
          <div key={i} className="w-full flex flex-col items-center">
            <div className={`w-full max-w-lg py-3 px-6 rounded-xl bg-gradient-to-r ${layer.color} text-white text-center font-medium text-sm shadow-lg`}>
              {layer.label}
            </div>
            {i < 3 && <ArrowRight className="w-5 h-5 text-white/30 rotate-90 my-1" />}
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}

function TechStackSlide() {
  return (
    <SlideLayout>
      <SectionHeader icon={<Code />} title="Technology Stack" />
      <div className="grid grid-cols-2 gap-4 mt-6">
        <TechCard category="Frontend" items={['React 18 + TypeScript', 'Vite (Build Tool)', 'Tailwind CSS + shadcn/ui', 'Recharts (Data Visualization)', 'React Router v6']} />
        <TechCard category="Backend" items={['Lovable Cloud (Supabase)', 'PostgreSQL Database', 'Row Level Security (RLS)', 'Edge Functions', 'Real-time Subscriptions']} />
        <TechCard category="Libraries" items={['React Query (Data Fetching)', 'React Hook Form + Zod', 'XLSX (Excel Export)', 'PapaParse (CSV Import)', 'Lucide Icons']} />
        <TechCard category="DevOps" items={['GitHub Actions (CI/CD)', 'Vitest (Testing)', 'ESLint (Code Quality)', 'Auto Deployment', 'Preview Environments']} />
      </div>
    </SlideLayout>
  );
}

function FeaturesStudentSlide() {
  return (
    <SlideLayout gradient="from-[#0a1628] to-[#0f1642]">
      <SectionHeader icon={<Users />} title="Student Features" color="cyan" />
      <div className="grid grid-cols-2 gap-5 mt-6">
        {[
          { title: 'Dashboard Overview', desc: 'View overall, theory & lab attendance at a glance with color-coded progress cards' },
          { title: 'Subject-wise Breakdown', desc: 'Detailed table showing attendance per subject with percentage indicators' },
          { title: 'Attendance Charts', desc: 'Monthly bar charts and pie charts for visual attendance analysis' },
          { title: 'Attendance Prediction', desc: 'AI-powered predictions on classes needed to reach 75% target' },
          { title: 'Timetable View', desc: 'Daily class schedule with room numbers and timing details' },
          { title: 'Notifications', desc: 'Bell icon with real-time alerts for low attendance warnings' },
        ].map((f, i) => (
          <FeatureItem key={i} title={f.title} desc={f.desc} index={i} />
        ))}
      </div>
    </SlideLayout>
  );
}

function FeaturesTeacherSlide() {
  return (
    <SlideLayout gradient="from-[#14082a] to-[#0a0e27]">
      <SectionHeader icon={<ClipboardCheck />} title="Teacher Features" color="violet" />
      <div className="grid grid-cols-2 gap-5 mt-6">
        {[
          { title: 'Mark Attendance', desc: 'Select subject, date, and mark individual students present/absent' },
          { title: 'Bulk CSV Import', desc: 'Upload attendance data in bulk using CSV/Excel files' },
          { title: 'Add Students', desc: 'Manually add student profiles with name, roll number, email' },
          { title: 'Student List', desc: 'View and filter all students by department with attendance status' },
          { title: 'Subject Management', desc: 'Create, edit, and manage subjects assigned to the teacher' },
          { title: 'Send Alerts', desc: 'Send manual notifications to students with low attendance' },
        ].map((f, i) => (
          <FeatureItem key={i} title={f.title} desc={f.desc} index={i} color="violet" />
        ))}
      </div>
    </SlideLayout>
  );
}

function FeaturesAdminSlide() {
  return (
    <SlideLayout gradient="from-[#1a1000] to-[#0a0e27]">
      <SectionHeader icon={<Shield />} title="Admin Features" color="amber" />
      <div className="grid grid-cols-2 gap-5 mt-6">
        {[
          { title: 'User Management', desc: 'View all users, assign roles (student/teacher/admin), manage accounts' },
          { title: 'System Analytics', desc: 'College-wide attendance statistics and department-wise breakdowns' },
          { title: 'Subject Overview', desc: 'View all subjects across departments with teacher assignments' },
          { title: 'Role Assignment', desc: 'Promote users to teacher or admin roles with one click' },
        ].map((f, i) => (
          <FeatureItem key={i} title={f.title} desc={f.desc} index={i} color="amber" />
        ))}
      </div>
    </SlideLayout>
  );
}

function DatabaseSlide() {
  return (
    <SlideLayout>
      <SectionHeader icon={<Database />} title="Database Schema" />
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { name: 'profiles', fields: ['user_id', 'name', 'email', 'roll_number', 'department', 'semester'] },
          { name: 'subjects', fields: ['name', 'code', 'type', 'department', 'semester', 'teacher_id'] },
          { name: 'attendance_records', fields: ['user_id', 'subject_id', 'date', 'status', 'created_at'] },
          { name: 'attendance_summary', fields: ['user_id', 'subject_id', 'total_classes', 'attended', 'percentage'] },
          { name: 'notifications', fields: ['user_id', 'title', 'message', 'type', 'read'] },
          { name: 'user_roles', fields: ['user_id', 'role (enum)', 'created_at'] },
        ].map((table, i) => (
          <div key={i} className="bg-white/5 rounded-xl border border-blue-500/10 overflow-hidden">
            <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/10">
              <p className="text-cyan-300 font-mono text-xs font-bold">{table.name}</p>
            </div>
            <div className="px-4 py-2 space-y-1">
              {table.fields.map((f, j) => (
                <p key={j} className="text-blue-200/50 text-[11px] font-mono">• {f}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SlideLayout>
  );
}

function ScreenshotsSlide() {
  return (
    <SlideLayout>
      <SectionHeader icon={<Smartphone />} title="Live Demo & Screenshots" />
      <div className="flex flex-col items-center mt-6 gap-4">
        <div className="w-full max-w-2xl bg-white/5 rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-blue-200/60 text-sm mb-4">The application is live and accessible at:</p>
          <div className="bg-white/5 rounded-xl px-6 py-3 border border-cyan-500/20 inline-block">
            <code className="text-cyan-400 text-lg font-mono">nizamcollegestudentattendance.lovable.app</code>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-8">
            {['Student Dashboard', 'Teacher Panel', 'Admin Console'].map((label, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/5">
                <div className="w-full h-20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-lg mb-3 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-cyan-400/40" />
                </div>
                <p className="text-blue-200/60 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}

function ConclusionSlide() {
  return (
    <SlideLayout gradient="from-[#0a1628] via-[#0f1f4b] to-[#0d2e4a]">
      <div className="flex flex-col items-center justify-center text-center h-full">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-6">
          <GraduationCap className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: 'Poppins' }}>Thank You!</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mb-6" />
        <p className="text-blue-200/70 text-lg mb-2">Student Attendance Management System</p>
        <p className="text-blue-300/40 text-sm mb-8">Nizam College (Autonomous) · Department of Computer Science</p>
        <div className="bg-white/5 rounded-xl px-8 py-4 border border-white/10">
          <p className="text-cyan-400 text-sm font-medium mb-1">Questions & Discussion</p>
          <p className="text-blue-200/40 text-xs">We'd love to hear your feedback!</p>
        </div>
      </div>
    </SlideLayout>
  );
}

/* ═══════════════════════════ REUSABLE COMPONENTS ═══════════════════════════ */

function SectionHeader({ icon, title, color = 'cyan' }: { icon: React.ReactNode; title: string; color?: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/20',
    rose: 'text-rose-400 border-rose-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
    violet: 'text-violet-400 border-violet-500/20',
    amber: 'text-amber-400 border-amber-500/20',
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-white/5 border ${colors[color]}`}>
        <span className={colors[color].split(' ')[0]}>{icon}</span>
      </div>
      <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Poppins' }}>{title}</h2>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/5">
      <h3 className="text-cyan-300 font-semibold text-sm mb-2">{title}</h3>
      <p className="text-blue-200/60 text-xs leading-relaxed">{text}</p>
    </div>
  );
}

function TechCard({ category, items }: { category: string; items: string[] }) {
  return (
    <div className="bg-white/5 rounded-xl p-5 border border-white/5">
      <h3 className="text-cyan-300 font-semibold text-sm mb-3">{category}</h3>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
            <p className="text-blue-200/60 text-xs">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureItem({ title, desc, index, color = 'cyan' }: { title: string; desc: string; index: number; color?: string }) {
  const accents: Record<string, string> = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/10',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/10',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/10',
  };
  return (
    <div className={`rounded-xl p-4 border ${accents[color]} bg-white/[0.02]`}>
      <div className="flex items-start gap-3">
        <span className={`text-xs font-bold mt-0.5 ${accents[color].split(' ')[1]}`}>0{index + 1}</span>
        <div>
          <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
          <p className="text-blue-200/50 text-xs leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  );
}
