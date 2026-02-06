import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { User, Bell, Save } from "lucide-react";

interface ProfileData {
  name: string;
  roll_number: string;
  department: string;
  semester: number;
  notification_enabled: boolean;
}

interface ProfileEditCardProps {
  userId: string;
  initialData: ProfileData;
  onSaved?: () => void;
}

export function ProfileEditCard({
  userId,
  initialData,
  onSaved,
}: ProfileEditCardProps) {
  const [name, setName] = useState(initialData.name);
  const [department, setDepartment] = useState(initialData.department);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initialData.notification_enabled
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          department: department.trim(),
          notification_enabled: notificationsEnabled,
        })
        .eq("user_id", userId);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Profile updated successfully!");
      onSaved?.();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Edit Profile
        </CardTitle>
        <CardDescription>
          Update your personal information and preferences
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roll">Roll Number</Label>
            <Input
              id="roll"
              value={initialData.roll_number}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Roll number cannot be changed
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept">Department</Label>
            <Input
              id="dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sem">Semester</Label>
            <Input
              id="sem"
              value={initialData.semester}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact admin to update semester
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive alerts when attendance drops
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={submitting} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
