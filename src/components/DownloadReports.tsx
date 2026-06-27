import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/csv";
import { Student, Subject } from "@/lib/mockData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

interface Props {
  student: Student;
  subjects: Subject[];
}

function stats(subjects: Subject[]) {
  const total = subjects.reduce((a, s) => a + s.totalClasses, 0);
  const attended = subjects.reduce((a, s) => a + s.attendedClasses, 0);
  const pct = total > 0 ? (attended / total) * 100 : 0;
  return { total, attended, pct };
}

export function DownloadReports({ student, subjects }: Props) {
  const handleCSV = () => {
    const { total, attended, pct } = stats(subjects);
    const meta = [
      ["Name", student.name],
      ["Roll Number", student.rollNumber],
      ["Email", student.email],
      ["Department", student.department],
      ["Semester", String(student.semester)],
      ["Generated", format(new Date(), "PPpp")],
      ["Total Classes", String(total)],
      ["Attended", String(attended)],
      ["Overall %", pct.toFixed(2)],
      ["Eligibility", pct >= 75 ? "ELIGIBLE" : "NOT ELIGIBLE"],
      [],
    ];
    const rows = subjects.map((s) => ({
      Subject: s.name,
      Code: s.code,
      Type: s.type,
      Total: s.totalClasses,
      Attended: s.attendedClasses,
      Percentage: s.percentage.toFixed(2),
      Status:
        s.percentage >= 75 ? "Safe" : s.percentage >= 70 ? "Warning" : "Critical",
    }));
    const metaCsv = meta.map((r) => r.join(",")).join("\n") + "\n";
    const subjectsCsv = toCSV(rows);
    downloadCSV(
      `Attendance_${student.rollNumber}_${format(new Date(), "yyyy-MM-dd")}.csv`,
      metaCsv + subjectsCsv
    );
    toast.success("CSV report downloaded");
  };

  const handlePDF = () => {
    const { total, attended, pct } = stats(subjects);
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(20, 90, 168);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Nizam College — Attendance Report", 14, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Osmania University", 14, 20);
    doc.text(
      `Generated: ${format(new Date(), "PPp")}`,
      pageW - 14,
      20,
      { align: "right" }
    );

    // Student details
    doc.setTextColor(20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Student Details", 14, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const details: [string, string][] = [
      ["Name", student.name],
      ["Roll Number", student.rollNumber],
      ["Email", student.email],
      ["Department", student.department],
      ["Semester", String(student.semester)],
    ];
    let y = 46;
    details.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, 14, y);
      doc.setFont("helvetica", "normal");
      doc.text(v, 50, y);
      y += 6;
    });

    // Summary
    const eligible = pct >= 75;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Overall Summary", 14, y + 6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Classes: ${total}`, 14, y + 14);
    doc.text(`Attended: ${attended}`, 70, y + 14);
    doc.text(`Percentage: ${pct.toFixed(2)}%`, 130, y + 14);

    doc.setFillColor(eligible ? 22 : 220, eligible ? 163 : 53, eligible ? 74 : 69);
    doc.setTextColor(255);
    doc.roundedRect(14, y + 18, 60, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.text(
      eligible ? "ELIGIBLE FOR EXAMS" : "NOT ELIGIBLE",
      44,
      y + 23.5,
      { align: "center" }
    );
    doc.setTextColor(20);

    // Subjects table
    autoTable(doc, {
      startY: y + 32,
      head: [["Subject", "Code", "Type", "Total", "Attended", "%", "Status"]],
      body: subjects.map((s) => [
        s.name,
        s.code,
        s.type,
        s.totalClasses,
        s.attendedClasses,
        `${s.percentage.toFixed(1)}%`,
        s.percentage >= 75
          ? "Safe"
          : s.percentage >= 70
          ? "Warning"
          : "Critical",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [20, 90, 168] },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 6) {
          const txt = String(data.cell.raw);
          if (txt === "Safe") data.cell.styles.textColor = [22, 163, 74];
          if (txt === "Warning") data.cell.styles.textColor = [202, 138, 4];
          if (txt === "Critical") data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `© Nizam College | Osmania University   •   Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: "center" }
      );
    }

    doc.save(
      `Attendance_${student.rollNumber}_${format(new Date(), "yyyy-MM-dd")}.pdf`
    );
    toast.success("PDF report downloaded");
  };

  const disabled = subjects.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handlePDF}
        disabled={disabled}
      >
        <FileText className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCSV}
        disabled={disabled}
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}