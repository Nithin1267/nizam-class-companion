import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Upload, FileSpreadsheet, Check, X, AlertCircle, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface BulkAttendanceImportProps {
  subjects: Subject[];
  onAttendanceImported: () => void;
}

interface ParsedRow {
  rollNumber: string;
  name?: string;
  status: 'present' | 'absent';
  matched?: boolean;
  userId?: string;
  error?: string;
}

export function BulkAttendanceImport({ subjects, onAttendanceImported }: BulkAttendanceImportProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsLoading(true);
    setParsedData([]);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let data: string[][] = [];

      if (extension === 'csv') {
        // Parse CSV
        const text = await file.text();
        const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
        data = result.data;
      } else if (extension === 'xlsx' || extension === 'xls') {
        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      // Process data (skip header row)
      const rows = data.slice(1).filter(row => row.length >= 2);
      const parsed: ParsedRow[] = rows.map(row => {
        const rollNumber = String(row[0]).trim();
        const name = row[2] ? String(row[2]).trim() : undefined;
        const statusRaw = String(row[1]).toLowerCase().trim();
        const status: 'present' | 'absent' = 
          statusRaw === 'p' || statusRaw === 'present' || statusRaw === '1' || statusRaw === 'yes' 
            ? 'present' 
            : 'absent';
        
        return { rollNumber, name, status };
      });

      // Match with database students
      await matchStudents(parsed);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to parse file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const matchStudents = async (parsed: ParsedRow[]) => {
    const { data: students, error } = await supabase
      .from('profiles')
      .select('user_id, roll_number, name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch student list',
        variant: 'destructive',
      });
      return;
    }

    const matched = parsed.map(row => {
      const student = students?.find(
        s => s.roll_number.toLowerCase() === row.rollNumber.toLowerCase()
      );
      
      if (student) {
        return {
          ...row,
          matched: true,
          userId: student.user_id,
          name: student.name,
        };
      }
      
      return {
        ...row,
        matched: false,
        error: 'Student not found',
      };
    });

    setParsedData(matched);
  };

  const saveAttendance = async () => {
    if (!selectedSubject || !user || parsedData.length === 0) return;

    const validRows = parsedData.filter(row => row.matched && row.userId);
    if (validRows.length === 0) {
      toast({
        title: 'Error',
        description: 'No valid students to save attendance for',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setProgress(0);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      // Delete existing attendance for this date and subject
      await supabase
        .from('attendance_records')
        .delete()
        .eq('subject_id', selectedSubject)
        .eq('date', dateStr);

      // Insert new attendance records
      const records = validRows.map(row => ({
        user_id: row.userId!,
        subject_id: selectedSubject,
        date: dateStr,
        status: row.status,
      }));

      const { error } = await supabase
        .from('attendance_records')
        .insert(records);

      if (error) throw error;

      // Update attendance summaries
      let completed = 0;
      for (const row of validRows) {
        const { data: existingSummary } = await supabase
          .from('attendance_summary')
          .select('*')
          .eq('user_id', row.userId!)
          .eq('subject_id', selectedSubject)
          .maybeSingle();

        if (existingSummary) {
          await supabase
            .from('attendance_summary')
            .update({
              total_classes: existingSummary.total_classes + 1,
              attended_classes: existingSummary.attended_classes + (row.status === 'present' ? 1 : 0),
            })
            .eq('id', existingSummary.id);
        } else {
          await supabase
            .from('attendance_summary')
            .insert({
              user_id: row.userId!,
              subject_id: selectedSubject,
              total_classes: 1,
              attended_classes: row.status === 'present' ? 1 : 0,
            });
        }

        completed++;
        setProgress((completed / validRows.length) * 100);
      }

      toast({
        title: 'Success!',
        description: `Attendance imported for ${validRows.length} students`,
      });

      // Reset state
      setParsedData([]);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onAttendanceImported();
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to save attendance',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setProgress(0);
    }
  };

  const downloadTemplate = () => {
    const template = 'Roll Number,Status (P/A),Name (Optional)\n001,P,John Doe\n002,A,Jane Smith';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const presentCount = parsedData.filter(r => r.status === 'present' && r.matched).length;
  const absentCount = parsedData.filter(r => r.status === 'absent' && r.matched).length;
  const unmatchedCount = parsedData.filter(r => !r.matched).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Bulk Attendance Import
        </CardTitle>
        <CardDescription>
          Upload a CSV or Excel file to import attendance for multiple students at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Subject and Date Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Subject</label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              "hover:border-primary/50 hover:bg-muted/50",
              isLoading && "pointer-events-none opacity-50"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={handleFileSelect}
              disabled={!selectedSubject}
            />
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
            {fileName ? (
              <p className="text-sm font-medium">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {selectedSubject 
                    ? 'Click to upload or drag and drop' 
                    : 'Select a subject first'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  CSV or Excel files (.csv, .xlsx, .xls)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Preview Table */}
        {parsedData.length > 0 && !isLoading && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                <span>
                  <span className="font-medium text-green-600">{presentCount}</span> Present
                </span>
                <span>
                  <span className="font-medium text-red-600">{absentCount}</span> Absent
                </span>
                {unmatchedCount > 0 && (
                  <span>
                    <span className="font-medium text-orange-600">{unmatchedCount}</span> Not Found
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {parsedData.filter(r => r.matched).length} of {parsedData.length} students matched
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Roll No</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">Match</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row, index) => (
                    <tr 
                      key={index}
                      className={cn(
                        "border-t",
                        !row.matched && "bg-orange-50 dark:bg-orange-950/20"
                      )}
                    >
                      <td className="px-4 py-3 text-sm">{row.rollNumber}</td>
                      <td className="px-4 py-3 text-sm">{row.name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            row.status === 'present'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {row.status === 'present' ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.matched ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-xs text-orange-600">{row.error}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Progress Bar */}
            {isSaving && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  Saving attendance... {Math.round(progress)}%
                </p>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={saveAttendance}
              disabled={isSaving || parsedData.filter(r => r.matched).length === 0}
              className="w-full"
              style={{ background: 'linear-gradient(135deg, hsl(174 62% 47%) 0%, hsl(221 83% 30%) 100%)' }}
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Attendance ({parsedData.filter(r => r.matched).length} students)
                </span>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
