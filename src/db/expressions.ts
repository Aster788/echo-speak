import { getSupabase } from "@/lib/supabase";
import type { Expression } from "@/types/expression";

export async function listExpressions(): Promise<Expression[]> {
  const { data, error } = await getSupabase().from("expressions").select("*");
  if (error) throw error;
  return (data ?? []) as Expression[];
}

export async function getExpression(id: string): Promise<Expression | null> {
  const { data, error } = await getSupabase()
    .from("expressions")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as Expression;
}

export async function createExpression(
  input: Omit<Expression, "id" | "createdAt">
): Promise<Expression> {
  const { data, error } = await getSupabase()
    .from("expressions")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as Expression;
}
