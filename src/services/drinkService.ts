import { localStore, Collections, makeLocalId } from '@/lib/localStore';
import { calculateStandardDrinks } from '@/lib/calculations';
import { writeLocalAndSync, requireUserId } from './base';
import type { DrinkingEvent, DrinkCategory, ServingSize, TriggerTag } from '@/types/domain';

export interface LogDrinkInput {
  drinkCategory: DrinkCategory;
  drinkName: string;
  quantity: number;
  servingSize: ServingSize;
  volumeMl: number;
  abvPercent: number;
  occurredAt?: string;
  costEstimate?: number | null;
  context?: string | null;
  mood?: number | null;
  trigger?: TriggerTag | null;
  notes?: string | null;
  wasPlanned?: boolean | null;
  locationLabel?: string | null;
  source?: DrinkingEvent['source'];
}

export async function logDrink(input: LogDrinkInput): Promise<DrinkingEvent> {
  const userId = requireUserId();
  const standardDrinksPerUnit = calculateStandardDrinks(input.volumeMl, input.abvPercent);

  const event: DrinkingEvent = {
    id: makeLocalId(),
    userId,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    drinkCategory: input.drinkCategory,
    drinkName: input.drinkName,
    quantity: input.quantity,
    servingSize: input.servingSize,
    volumeMl: input.volumeMl,
    abvPercent: input.abvPercent,
    standardDrinks: Math.round(standardDrinksPerUnit * input.quantity * 100) / 100,
    costEstimate: input.costEstimate ?? null,
    context: input.context ?? null,
    mood: input.mood ?? null,
    trigger: input.trigger ?? null,
    notes: input.notes ?? null,
    wasPlanned: input.wasPlanned ?? null,
    locationLabel: input.locationLabel ?? null,
    source: input.source ?? 'manual',
  };

  return writeLocalAndSync(Collections.drinkingEvents, event, 'drinking_events', (e) => ({
    id: e.id,
    user_id: e.userId,
    occurred_at: e.occurredAt,
    drink_category: e.drinkCategory,
    drink_name: e.drinkName,
    quantity: e.quantity,
    serving_size: e.servingSize,
    volume_ml: e.volumeMl,
    abv_percent: e.abvPercent,
    standard_drinks: e.standardDrinks,
    cost_estimate: e.costEstimate,
    context: e.context,
    mood: e.mood,
    trigger: e.trigger,
    notes: e.notes,
    was_planned: e.wasPlanned,
    location_label: e.locationLabel,
    source: e.source,
  }));
}

export async function getDrinkingEvents(): Promise<DrinkingEvent[]> {
  const events = await localStore.list<DrinkingEvent>(Collections.drinkingEvents);
  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export async function deleteDrinkingEvent(id: string): Promise<void> {
  await localStore.remove(Collections.drinkingEvents, id);
}
