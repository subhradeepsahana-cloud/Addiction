# Safety Architecture

## Principle

Safety-sensitive decisions never depend exclusively on an LLM. A deterministic, regex-based classifier (`src/lib/safety.ts` on-device; `supabase/functions/_shared/safety.ts` as an Edge Function backstop — kept in sync) runs on every piece of free text the user enters into a check-in note, craving note, or AI Coach message, **before** any AI call. If it trips, the AI is never called for that turn at all.

## Levels and categories

| Level | Meaning | Example trigger |
|---|---|---|
| `none` | No safety signal | ordinary text |
| `monitor` | Risk factor worth flagging, no acute symptom | "I drink heavily every day and stopped suddenly" |
| `urgent` | Serious but not immediately life-threatening | hallucinations, confusion, severe tremors, severe vomiting |
| `emergency` | Immediate danger | seizure, loss of consciousness, can't breathe, suicidal intent, overdose |

Categories: `self_harm`, `medical_emergency`, `withdrawal_risk`.

## Escalation, never de-escalation

`combineSafetyLevel(a, b)` always keeps the more severe of two classifications. Any future AI-side classifier is passed as the second argument — it can raise a `none` to `urgent`, but a rule-based `emergency` can never be talked down by a model. This is enforced structurally (see the function's implementation and its unit tests in `src/lib/__tests__/safety.test.ts`), not just by convention.

## What the user sees

`src/components/SafetyBanner.tsx` intercepts the UI whenever a classification is not `none`:

- `self_harm` → compassionate framing, crisis line + emergency number for the user's configured country, **no "continue" option**.
- `medical_emergency` → emergency number front and center, no continue option.
- `withdrawal_risk` → explains why stopping suddenly after heavy use can be risky, recommends medical guidance, allows the user to continue once acknowledged (not itself an emergency).

The app never attempts to manage withdrawal (no tapering schedules, no medication guidance) and never diagnoses. Copy is reviewed against the product rule: no shame, no scare tactics, no guaranteed outcomes.

## Emergency-resource architecture

`src/constants/emergencyResources.ts` maps an ISO country code to: local emergency number, a crisis line, and an alcohol-specific support line where one is known. The user sets their country in Settings (`emergencyCountry`, defaults to `US`); `getEmergencyResources()` falls back to a generic international entry (`findahelpline.com`) if the code isn't in the small curated list. This list should be reviewed periodically — the numbers included (US, GB, CA, AU, IN) are widely published national lines, not independently re-verified by this codebase at build time.

## Auditing without storing sensitive content

`safety_events` (Postgres) records **classification metadata only** — level, category, matched rule names, source context — never the raw message text. This lets the (future) admin surface track safety-event volume and category mix without ever exposing what a user actually wrote. The table has no update/delete policy: it is an append-only audit trail.

## Testing

`src/lib/__tests__/safety.test.ts` includes the exact dangerous-input examples from the product spec ("I just had a seizure", "I am seeing things", "I want to kill myself", sudden cessation after heavy daily drinking) and asserts the expected level/category/action for each.
