import { describe, expect, it } from "vitest";
import {
  formValuesToRow,
  llmOverridesFromFormValues,
  mergeFormValuesWithStoredRow,
  mergeSettingsWithEnv,
  rowToFormValues,
  rowToStoredValues,
} from "@/lib/user-settings";

describe("user settings merge", () => {
  it("falls back to deployment env only for hidden Supabase keys", () => {
    process.env.LLM_API_KEY = "env-key";
    process.env.LLM_BASE_URL = "https://api.deepseek.com";
    process.env.LLM_MODEL = "deepseek-chat";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://env.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "env-anon";
    process.env.FEISHU_APP_ID = "env-feishu";
    process.env.FEISHU_APP_SECRET = "env-secret";

    const merged = mergeSettingsWithEnv(
      rowToStoredValues({
        llm_api_key: null,
        llm_base_url: null,
        llm_model: null,
        supabase_url: null,
        supabase_anon_key: null,
        feishu_app_id: null,
        feishu_app_secret: null,
      })
    );

    expect(merged.LLM_API_KEY).toBe("");
    expect(merged.LLM_BASE_URL).toBe("");
    expect(merged.LLM_MODEL).toBe("");
    expect(merged.FEISHU_APP_ID).toBe("");
    expect(merged.FEISHU_APP_SECRET).toBe("");
    expect(merged.NEXT_PUBLIC_SUPABASE_URL).toBe("https://env.supabase.co");
    expect(merged.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("env-anon");
  });

  it("round-trips form values through row columns", () => {
    const values = {
      LLM_API_KEY: "k",
      LLM_BASE_URL: "https://example.com",
      LLM_MODEL: "m",
      FEISHU_APP_ID: "id",
      FEISHU_APP_SECRET: "secret",
    };
    const row = formValuesToRow({
      ...values,
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
    });
    expect(rowToFormValues({ user_id: "u", ...row, created_at: "", updated_at: "" })).toEqual(
      values
    );
  });

  it("preserves hidden columns when saving form values", () => {
    const existing = {
      user_id: "u",
      llm_api_key: "old",
      llm_base_url: null,
      llm_model: null,
      supabase_url: "https://supabase.co",
      supabase_anon_key: "anon",
      feishu_app_id: null,
      feishu_app_secret: null,
      created_at: "",
      updated_at: "",
    };
    const merged = mergeFormValuesWithStoredRow(
      {
        LLM_API_KEY: "new",
        LLM_BASE_URL: "",
        LLM_MODEL: "",
        FEISHU_APP_ID: "",
        FEISHU_APP_SECRET: "",
      },
      existing
    );
    expect(merged.LLM_API_KEY).toBe("new");
    expect(merged.NEXT_PUBLIC_SUPABASE_URL).toBe("https://supabase.co");
    expect(merged.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("anon");
  });

  it("maps user-owned form values to llm overrides without env", () => {
    const overrides = llmOverridesFromFormValues({
      LLM_API_KEY: "user-key",
      LLM_BASE_URL: "",
      LLM_MODEL: "",
    });
    expect(overrides.apiKey).toBe("user-key");
    expect(overrides.baseUrl).toBeUndefined();
    expect(overrides.model).toBeUndefined();
  });
});
