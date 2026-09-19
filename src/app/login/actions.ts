"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function login(formData: FormData) {
  const email = clean(formData.get("email"));
  const password = clean(formData.get("password"));

  if (!email || !password) {
    redirect("/login?error=Enter%20your%20email%20and%20password.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const fullName = clean(formData.get("full_name"));
  const email = clean(formData.get("email"));
  const password = clean(formData.get("password"));

  if (!fullName || !email || password.length < 8) {
    redirect("/signup?error=Complete%20all%20fields%20and%20use%20at%20least%208%20characters.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    await supabase.from("profiles").upsert({
      id: data.user!.id,
      full_name: fullName,
    });
    redirect("/onboarding");
  }

  redirect("/check-email");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
