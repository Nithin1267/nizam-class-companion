import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import { CalendarIcon, Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface AttendanceExportProps {
  userId: string;
  studentName: string;
}

export function AttendanceExport({ userId, studentName }: AttendanceExportProps) {
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [exporting, setExporting] = useState(false);

  const fetchAttendanceData = async () => {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("date, status, subjects(name, code, type)")
      .eq("user_id", userId)
      .gte("date", format(startDate, "yyyy-MM-dd"))
      .lte("date", format(endDate, "yyyy-MM-dd"))
      .order("date", { ascending: true });

    if (error) throw error;
    return data;
  };

  const fetchSummaryData = async () => {
    const { data, error } = await supabase
      .from("attendance_summary")
      .select("*, subjects(name, code, type)")
      .eq("user_id", userId);

    if (error) throw error;
    return data;
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const [records, summary] = await Promise.all([
        fetchAttendanceData(),
        fetchSummaryData(),
      ]);

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = (summary || []).map((s: any) => ({
        Subject: s.subjects?.name || "Unknown",
        Code: s.subjects?.code || "N/A",
        Type: s.subjects?.type || "theory",
        "Total Classes": s.total_classes,
        Attended: s.attended_classes,
        "Percentage (%)": s.percentage,
      }));
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Records sheet
      const recordsData = (records || []).map((r: any) => ({
        Date: r.date,
        Subject: r.subjects?.name || "Unknown",
        Code: r.subjects?.code || "N/A",
        Type: r.subjects?.type || "theory",
        Status: r.status,
      }));
      const recordsSheet = XLSX.utils.json_to_sheet(recordsData);
      XLSX.utils.book_append_sheet(wb, recordsSheet, "Daily Records");

      // Generate and download
      const fileName = `Attendance_${studentName.replace(/\s+/g, "_")}_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Excel report downloaded!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const [records, summary] = await Promise.all([
        fetchAttendanceData(),
        fetchSummaryData(),
      ]);

      // Generate HTML for PDF
      const html = `
        <html>
          <head>
            <title>Attendance Report - ${studentName}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f4f4f4; }
              .header { margin-bottom: 20px; }
              .summary { margin-bottom: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Attendance Report</h1>
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Period:</strong> ${format(startDate, "MMM d, yyyy")} - ${format(
        endDate,
        "MMM d, yyyy"
      )}</p>
              <p><strong>Generated:</strong> ${format(new Date(), "MMM d, yyyy h:mm a")}</p>
            </div>
            
            <div class="summary">
              <h2>Summary</h2>
              <table>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Total</th>
                  <th>Attended</th>
                  <th>Percentage</th>
                </tr>
                ${(summary || [])
                  .map(
                    (s: any) => `
                  <tr>
                    <td>${s.subjects?.name || "Unknown"}</td>
                    <td>${s.subjects?.code || "N/A"}</td>
                    <td>${s.subjects?.type || "theory"}</td>
                    <td>${s.total_classes}</td>
                    <td>${s.attended_classes}</td>
                    <td>${s.percentage}%</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </div>

            <div>
              <h2>Daily Records</h2>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
                ${(records || [])
                  .map(
                    (r: any) => `
                  <tr>
                    <td>${r.date}</td>
                    <td>${r.subjects?.name || "Unknown"}</td>
                    <td>${r.status}</td>
                  </tr>
                `
                  )
                  .join("")}
              </table>
            </div>
          </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        toast.success("PDF report opened for printing!");
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <Download className="w-5 h-5 text-primary" />
          Export Attendance
        </CardTitle>
        <CardDescription>
          Download your attendance records as Excel or PDF
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Start Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">End Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={exportToExcel}
            disabled={exporting}
            className="flex-1"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={exporting}
            variant="outline"
            className="flex-1"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
