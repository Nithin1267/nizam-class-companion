import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ProfileEditCard } from "@/components/ProfileEditCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Loader2,
  Camera,
  User,
  Mail,
  Phone,
  Hash,
  Building2,
  GraduationCap,
  Users,
  CalendarDays,
  KeyRound,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ProfileData {
  name: string;
  email: string;
  roll_number: string;
  department: string;
  semester: number;
  notification_enabled: boolean;
  mobile_number: string | null;
  section: string | null;
  date_of_joining: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [mobile, setMobile] = useState("");
  const [section, setSection] = useState("");
  const [doj, setDoj] = useState("");
  const [saving, setSaving] = useState(false);

  const [signedAvatar, setSignedAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "name, email, roll_number, department, semester, notification_enabled, mobile_number, section, date_of_joining, avatar_url"
      )
      .eq("user_id", user.id)
      .single();

    if (!error && data) {
      setProfile(data as ProfileData);
      setMobile(data.mobile_number ?? "");
      setSection(data.section ?? "");
      setDoj(data.date_of_joining ?? "");
      if (data.avatar_url) {
        const { data: signed } = await supabase.storage
          .from("avatars")
          .createSignedUrl(data.avatar_url, 60 * 60);
        setSignedAvatar(signed?.signedUrl ?? null);
      } else {
        setSignedAvatar(null);
      }
    }
    setLoading(false);
  };

  const saveContact = async () => {
    if (!user) return;
    if (mobile && !/^[+\d][\d\s-]{6,18}$/.test(mobile)) {
      toast.error("Enter a valid mobile number");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        mobile_number: mobile || null,
        section: section || null,
        date_of_joining: doj || null,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile details saved");
    fetchProfile();
  };

  const onPickFile = () => fileRef.current?.click();

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image must be under 3 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Clean up old avatar
      if (profile?.avatar_url && profile.avatar_url !== path) {
        await supabase.storage.from("avatars").remove([profile.avatar_url]);
      }

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("user_id", user.id);
      if (dbErr) throw dbErr;

      toast.success("Profile photo updated");
      fetchProfile();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const changePassword = async () => {
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    setPwdSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdSaving(false);
    if (error) return toast.error(error.message);
    setNewPwd("");
    setConfirmPwd("");
    toast.success("Password updated");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold font-display mb-6">
          Profile &amp; Settings
        </h1>

        {/* Top identity card */}
        <Card className="mb-6 overflow-hidden">
          <div className="hero-gradient h-24" />
          <CardContent className="pt-0">
            <div className="-mt-12 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full ring-4 ring-card bg-muted overflow-hidden flex items-center justify-center">
                  {signedAvatar ? (
                    <img
                      src={signedAvatar}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={onPickFile}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:opacity-90 disabled:opacity-60"
                  title="Change photo"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadAvatar(f);
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="sm:pb-1">
                <h2 className="text-xl font-semibold font-display">
                  {profile.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Roll No. {profile.roll_number} · Semester {profile.semester}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mt-6 text-sm">
              <InfoRow icon={User} label="Full Name" value={profile.name} />
              <InfoRow icon={Hash} label="Roll Number" value={profile.roll_number} />
              <InfoRow icon={Mail} label="Email" value={profile.email} />
              <InfoRow
                icon={Phone}
                label="Mobile Number"
                value={profile.mobile_number || "—"}
              />
              <InfoRow
                icon={Building2}
                label="Department"
                value={profile.department}
              />
              <InfoRow
                icon={GraduationCap}
                label="Semester"
                value={String(profile.semester)}
              />
              <InfoRow
                icon={Users}
                label="Section"
                value={profile.section || "—"}
              />
              <InfoRow
                icon={CalendarDays}
                label="Date of Joining"
                value={
                  profile.date_of_joining
                    ? format(new Date(profile.date_of_joining), "MMM d, yyyy")
                    : "—"
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Editable contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">
                Contact &amp; Section
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input
                  id="section"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  placeholder="e.g. A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doj">Date of Joining</Label>
                <Input
                  id="doj"
                  type="date"
                  value={doj}
                  onChange={(e) => setDoj(e.target.value)}
                />
              </div>
              <Button onClick={saveContact} disabled={saving}>
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save changes
              </Button>
            </CardContent>
          </Card>

          {/* Academic profile (existing card kept) */}
          <ProfileEditCard
            userId={user.id}
            initialData={{
              name: profile.name,
              roll_number: profile.roll_number,
              department: profile.department,
              semester: profile.semester,
              notification_enabled: profile.notification_enabled,
            }}
            onSaved={fetchProfile}
          />

          {/* Password change */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPwd">New Password</Label>
                <Input
                  id="newPwd"
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPwd">Confirm Password</Label>
                <Input
                  id="confirmPwd"
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={changePassword} disabled={pwdSaving}>
                  {pwdSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}
