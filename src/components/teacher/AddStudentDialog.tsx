import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { z } from "zod";

const studentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  rollNumber: z
    .string()
    .trim()
    .min(2, "Roll number must be at least 2 characters")
    .max(50, "Roll number must be less than 50 characters"),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  department: z
    .string()
    .trim()
    .min(2, "Department is required")
    .max(100, "Department must be less than 100 characters"),
  semester: z.number().min(1).max(12),
});

interface AddStudentDialogProps {
  defaultDepartment?: string;
  onStudentAdded?: () => void;
}

export function AddStudentDialog({
  defaultDepartment = "",
  onStudentAdded,
}: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState(defaultDepartment);
  const [semester, setSemester] = useState("1");

  const resetForm = () => {
    setName("");
    setRollNumber("");
    setEmail("");
    setDepartment(defaultDepartment);
    setSemester("1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const result = studentSchema.safeParse({
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      email: email.trim(),
      department: department.trim(),
      semester: parseInt(semester),
    });

    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setSubmitting(true);

    try {
      // Check if roll number already exists
      const { data: existingRoll } = await supabase
        .from("profiles")
        .select("id")
        .eq("roll_number", rollNumber.trim())
        .maybeSingle();

      if (existingRoll) {
        toast.error("This roll number is already registered");
        return;
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (existingEmail) {
        toast.error("This email is already registered");
        return;
      }

      // Create the student profile
      // Note: This creates a profile entry without an auth user
      // The student will need to sign up with this email to link their account
      const { error } = await supabase.from("profiles").insert({
        user_id: crypto.randomUUID(), // Placeholder until student signs up
        name: name.trim(),
        roll_number: rollNumber.trim(),
        email: email.trim(),
        department: department.trim(),
        semester: parseInt(semester),
      });

      if (error) {
        if (error.message.includes("profiles_roll_number_key")) {
          toast.error("This roll number is already registered");
        } else if (error.message.includes("profiles_email_key")) {
          toast.error("This email is already registered");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success(`Student "${name}" added successfully!`);
      resetForm();
      setOpen(false);
      onStudentAdded?.();
    } catch (err) {
      console.error("Error adding student:", err);
      toast.error("Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Enter student details. They can sign up later with this email to
            access their dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student-name">Full Name *</Label>
              <Input
                id="student-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., John Doe"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-roll">Roll Number *</Label>
              <Input
                id="student-roll"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g., NC2023CS001"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-email">Email *</Label>
              <Input
                id="student-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., student@example.com"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-dept">Department *</Label>
              <Input
                id="student-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-sem">Semester *</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="student-sem">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
