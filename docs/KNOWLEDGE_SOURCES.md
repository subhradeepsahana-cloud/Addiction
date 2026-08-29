# Scientific Knowledge Base

## Sources

Content is seeded from four organizations (`supabase/migrations/0012_health_knowledge_seed.sql`, mirrored offline in `src/constants/healthArticles.ts`):

- World Health Organization (WHO)
- National Institute on Alcohol Abuse and Alcoholism (NIAAA)
- Centers for Disease Control and Prevention (CDC)
- National Health Service, UK (NHS)

Each article states general, widely published public-health positions in hedged, non-prescriptive language and links to that organization's own site — it does not cite specific studies, papers, or statistics that could not be verified at the time this codebase was written. **Before a production launch, a human reviewer should open every `source_url` in `health_articles`, confirm it still resolves to relevant content, and update `last_verified_date`.**

## Retrieval

`supabase/functions/health-assistant` does simple keyword retrieval (`ilike` match on topic/title/content) over `health_articles`, hands **only** the matched excerpts to the model, and requires the response to cite which excerpt(s) support each claim (`HEALTH_ASSISTANT_SYSTEM_PROMPT` in `supabase/functions/_shared/prompts.ts`). If no article matches, the function returns a canned "I don't have a verified source for that" response rather than letting the model answer from its own training data.

## Update mechanism

- `health_articles.last_verified_date` tracks freshness. The `health_articles_freshness` view (migration `0009`) flags any article not re-verified in 180 days (`needs_review = true`) — query it in Supabase Studio or wire it into the admin surface described in `docs/ROADMAP.md`.
- To update content: edit the row directly in Supabase Studio or via a new migration, then update `last_verified_date`. There is no automated content-fetching pipeline by design — auto-ingesting external content without human review risks introducing unverified or fabricated claims, which the product explicitly must avoid.
- Keep `src/constants/healthArticles.ts` (the offline mirror used in mock mode and for the static article-detail screen) in sync with the database when content changes.

## Evidence levels

Each article has an `evidence_level`: `high` (well-established, broad scientific consensus), `moderate` (generally accepted but with some evolving nuance), `emerging` (early evidence, stated as such). The AI is instructed to reflect this distinction rather than presenting all claims with equal confidence.
