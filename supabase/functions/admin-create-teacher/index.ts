import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreateTeacherPayload {
  name: string;
  email: string;
  password: string;
  department: string;
  semester: number;
  section?: string | null;
  subjectIds: string[];
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Missing authorization" }, 401);

    // Verify caller is admin using their JWT
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "Admin access required" }, 403);

    const body = (await req.json()) as CreateTeacherPayload;
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const department = (body.department || "").trim();
    const semester = Number(body.semester);
    const section = body.section?.trim() || null;
    const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds : [];

    if (!name || name.length < 2) return json({ error: "Name is required" }, 400);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email required" }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
    if (!department) return json({ error: "Department is required" }, 400);
    if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
      return json({ error: "Valid semester required" }, 400);
    }
    if (subjectIds.length === 0) return json({ error: "Select at least one subject" }, 400);

    // Create auth user (auto-confirm)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { signup_as_teacher: "true", name },
    });

    if (createErr || !created.user) {
      return json({ error: createErr?.message || "Failed to create user" }, 400);
    }

    const teacherId = created.user.id;

    // Ensure teacher role (handle_new_user_role trigger should have set it, but be defensive)
    await admin
      .from("user_roles")
      .upsert({ user_id: teacherId, role: "teacher" }, { onConflict: "user_id,role" });

    // Profile row
    await admin.from("profiles").upsert(
      {
        user_id: teacherId,
        email,
        name,
        roll_number: `TEACHER-${teacherId.slice(0, 8)}`,
        department,
        semester,
        section,
      },
      { onConflict: "user_id" }
    );

    // Assignment
    const { error: assignErr } = await admin
      .from("teacher_assignments")
      .upsert(
        { teacher_id: teacherId, department, semester, section },
        { onConflict: "teacher_id,department,semester" }
      );
    if (assignErr) return json({ error: `Assignment failed: ${assignErr.message}` }, 400);

    // Subjects
    const subjectRows = subjectIds.map((subject_id) => ({ teacher_id: teacherId, subject_id }));
    const { error: subErr } = await admin
      .from("teacher_subjects")
      .upsert(subjectRows, { onConflict: "teacher_id,subject_id" });
    if (subErr) return json({ error: `Subject assignment failed: ${subErr.message}` }, 400);

    return json({ ok: true, teacher_id: teacherId });
  } catch (e) {
    console.error("admin-create-teacher error", e);
    return json({ error: (e as Error).message || "Unexpected error" }, 500);
  }
});