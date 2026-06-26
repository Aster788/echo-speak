import { describe, expect, it } from "vitest";
import { assertSupabaseKeyMatchesUrl } from "@/lib/supabase-env";

const LOCAL_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// JWT with ref ejgybfiywdbnfzckjqao (fake signature; validation only decodes payload)
const CLOUD_SERVICE_ROLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZ3liZml5d2RibmZ6Y2tqcWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk5OTk5OTk5OX0.x";

describe("assertSupabaseKeyMatchesUrl", () => {
  it("allows local URL with demo service role key", () => {
    expect(() =>
      assertSupabaseKeyMatchesUrl("http://127.0.0.1:54321", LOCAL_SERVICE_ROLE)
    ).not.toThrow();
  });

  it("rejects local URL with cloud service role key", () => {
    expect(() =>
      assertSupabaseKeyMatchesUrl("http://127.0.0.1:54321", CLOUD_SERVICE_ROLE)
    ).toThrow(/local CLI/);
  });

  it("rejects cloud URL with demo service role key", () => {
    expect(() =>
      assertSupabaseKeyMatchesUrl(
        "https://ejgybfiywdbnfzckjqao.supabase.co",
        LOCAL_SERVICE_ROLE
      )
    ).toThrow(/cloud but the service role key is the local demo key/);
  });
});
