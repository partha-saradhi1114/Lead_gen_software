<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

## Project rules

- All dashboard data is frontend-only sample data in `src/lib/leadgen/` (deterministic seed + pure reducer exposed via `LeadGenProvider`); KPIs are derived from lead state, never hard-coded, so approvals/rejections update every card. Why: backend is intentionally not connected yet.
- Lead-flow rules (approve/reject/upload/allocate) live in the pure reducer and are covered by `src/lib/leadgen/reducer.test.js`. Why: keeps business rules testable and portable to a future backend.
- App shell (navy sidebar + header) is mounted once in `src/routes/__root.jsx`; menu items are defined in `src/components/layout/nav.js`. Why: one source for navigation and page titles.
- Recharts charts render inside `<ClientOnly>`. Why: Recharts generates random ids that cause hydration mismatches.
- Source is plain JavaScript (.js/.jsx); only the auto-generated `src/routeTree.gen.ts` stays TypeScript. Why: the user chose JS, and TanStack Start always emits a TS route tree. `tsconfig.json` (allowJs) stays for the `@/` alias.
- Role areas (admin `/`, RA `/ra/*`, BDE `/bde/*`) share one shell; `roleForPath` in nav.js picks the menu, header identity and badges. BDE rules (unlock costs credits, stage counters, follow-ups) live in `src/lib/leadgen/bde.js`, tested in `bde.test.js`. Why: one switchable demo until real roles come with the backend.
