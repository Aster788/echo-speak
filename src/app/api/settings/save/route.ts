import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { getUserSettings, upsertUserSettings } from "@/db/user-settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  emptyFormValues,
  mergeFormValuesWithStoredRow,
  USER_SETTINGS_FORM_FIELDS,
  type UserSettingsFormValues,
} from "@/lib/user-settings";

function parseBody(body: Record<string, unknown>): UserSettingsFormValues {
  const values = emptyFormValues();
  for (const field of USER_SETTINGS_FORM_FIELDS) {
    const raw = body[field.key];
    values[field.key] = typeof raw === "string" ? raw : "";
  }
  return values;
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in to save settings." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const formValues = parseBody(body);
    const supabase = await createSupabaseServerClient();
    const existing = await getUserSettings(user.id, supabase);
    const storedValues = mergeFormValuesWithStoredRow(formValues, existing);
    await upsertUserSettings(user.id, storedValues, supabase);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Could not save settings.",
      },
      { status: 500 }
    );
  }
}
