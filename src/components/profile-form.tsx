"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  initial: {
    full_name: string | null;
    headline: string | null;
    location: string | null;
    work_preference: string | null;
  } | null;
};

export default function ProfileForm({ userId, initial }: ProfileFormProps) {
  const supabase = createClient();
  const [name, setName] = useState(initial?.full_name ?? "");
  const [headline, setHeadline] = useState(initial?.headline ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [workPreference, setWorkPreference] = useState(initial?.work_preference ?? "remote");
  const [status, setStatus] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving…");

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      full_name: name || null,
      headline: headline || null,
      location: location || null,
      work_preference: workPreference,
    });

    setStatus(error ? error.message : "Saved");
  }

  return (
    <form className="card" style={{ padding: 26, marginTop: 28 }} onSubmit={save}>
      <div style={{ display: "grid", gap: 18 }}>
        <label className="field-label">Name<input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field-label">Professional headline<input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Senior GRC / Cybersecurity Manager" /></label>
        <label className="field-label">Location<input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Houston, TX" /></label>
        <label className="field-label">Work preference
          <select className="input" value={workPreference} onChange={(e) => setWorkPreference(e.target.value)}>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
            <option value="flexible">Flexible</option>
          </select>
        </label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 22 }}>
        <button className="btn btn-primary" type="submit">Save changes</button>
        {status ? <span className="muted" style={{ fontSize: 14 }}>{status}</span> : null}
      </div>
    </form>
  );
}
