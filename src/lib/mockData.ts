export interface Subject {
  id: string;
  name: string;
  code: string;
  type: 'theory' | 'lab';
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
}

export interface AttendanceRecord {
  date: string;
  subject: string;
  status: 'present' | 'absent';
  type: 'theory' | 'lab';
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  semester: number;
  email: string;
}

export const mockStudent: Student = {
  id: '1',
  name: 'Rahul Kumar',
  rollNumber: 'NC2023CS101',
  department: 'Computer Science',
  semester: 4,
  email: 'rahul.kumar@nizam.edu',
};

export const mockSubjects: Subject[] = [
  {
    id: '1',
    name: 'Data Structures',
    code: 'CS301',
    type: 'theory',
    totalClasses: 45,
    attendedClasses: 38,
    percentage: 84.4,
  },
  {
    id: '2',
    name: 'Data Structures Lab',
    code: 'CS301L',
    type: 'lab',
    totalClasses: 20,
    attendedClasses: 18,
    percentage: 90,
  },
  {
    id: '3',
    name: 'Database Management',
    code: 'CS302',
    type: 'theory',
    totalClasses: 42,
    attendedClasses: 35,
    percentage: 83.3,
  },
  {
    id: '4',
    name: 'Database Lab',
    code: 'CS302L',
    type: 'lab',
    totalClasses: 18,
    attendedClasses: 14,
    percentage: 77.8,
  },
  {
    id: '5',
    name: 'Operating Systems',
    code: 'CS303',
    type: 'theory',
    totalClasses: 40,
    attendedClasses: 28,
    percentage: 70,
  },
  {
    id: '6',
    name: 'Operating Systems Lab',
    code: 'CS303L',
    type: 'lab',
    totalClasses: 15,
    attendedClasses: 10,
    percentage: 66.7,
  },
  {
    id: '7',
    name: 'Computer Networks',
    code: 'CS304',
    type: 'theory',
    totalClasses: 38,
    attendedClasses: 32,
    percentage: 84.2,
  },
  {
    id: '8',
    name: 'Software Engineering',
    code: 'CS305',
    type: 'theory',
    totalClasses: 35,
    attendedClasses: 30,
    percentage: 85.7,
  },
];

export const mockAttendanceHistory: AttendanceRecord[] = [
  { date: '2024-01-22', subject: 'Data Structures', status: 'present', type: 'theory' },
  { date: '2024-01-22', subject: 'Database Management', status: 'present', type: 'theory' },
  { date: '2024-01-22', subject: 'Data Structures Lab', status: 'present', type: 'lab' },
  { date: '2024-01-21', subject: 'Operating Systems', status: 'absent', type: 'theory' },
  { date: '2024-01-21', subject: 'Computer Networks', status: 'present', type: 'theory' },
  { date: '2024-01-20', subject: 'Software Engineering', status: 'present', type: 'theory' },
  { date: '2024-01-20', subject: 'Database Lab', status: 'present', type: 'lab' },
  { date: '2024-01-19', subject: 'Data Structures', status: 'present', type: 'theory' },
  { date: '2024-01-19', subject: 'Operating Systems Lab', status: 'absent', type: 'lab' },
  { date: '2024-01-18', subject: 'Database Management', status: 'present', type: 'theory' },
];

export const getOverallAttendance = () => {
  const total = mockSubjects.reduce((acc, sub) => acc + sub.totalClasses, 0);
  const attended = mockSubjects.reduce((acc, sub) => acc + sub.attendedClasses, 0);
  return Math.round((attended / total) * 100 * 10) / 10;
};

export const getTheoryAttendance = () => {
  const theorySubjects = mockSubjects.filter((s) => s.type === 'theory');
  const total = theorySubjects.reduce((acc, sub) => acc + sub.totalClasses, 0);
  const attended = theorySubjects.reduce((acc, sub) => acc + sub.attendedClasses, 0);
  return Math.round((attended / total) * 100 * 10) / 10;
};

export const getLabAttendance = () => {
  const labSubjects = mockSubjects.filter((s) => s.type === 'lab');
  const total = labSubjects.reduce((acc, sub) => acc + sub.totalClasses, 0);
  const attended = labSubjects.reduce((acc, sub) => acc + sub.attendedClasses, 0);
  return Math.round((attended / total) * 100 * 10) / 10;
};

export const getMonthlyData = () => [
  { month: 'Aug', classes: 85, labs: 90 },
  { month: 'Sep', classes: 82, labs: 88 },
  { month: 'Oct', classes: 78, labs: 85 },
  { month: 'Nov', classes: 80, labs: 82 },
  { month: 'Dec', classes: 75, labs: 78 },
  { month: 'Jan', classes: 82, labs: 85 },
];
