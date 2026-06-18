# Architecture Decision Records

## ADR-001: Next.js App Router

**Context:** Need a React UI with API routes and SSR for Supabase.

**Decision:** Use Next.js 15 App Router with client components only where needed.

**Consequences:** Server components for data fetching; `src/app/` route structure.

---

## ADR-002: Service layer separation

**Context:** LLM pipelines and DB access should be testable without UI.

**Decision:** Business logic in `src/services/`; DB in `src/db/`; prompts in `prompts/`.

**Consequences:** Scripts and tests can import services directly.
