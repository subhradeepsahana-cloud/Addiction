import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip, ChipGroup } from '@/components/Chip';
import { IntensityScale } from '@/components/IntensityScale';
import { TextField } from '@/components/TextField';
import { SafetyBanner } from '@/components/SafetyBanner';
import { useTheme } from '@/theme/ThemeProvider';
import { useCountdown } from '@/hooks/useCountdown';
import { TRIGGER_OPTIONS, INTERVENTION_OPTIONS } from '@/constants/drinkCatalog';
import { startCraving, recordInterventionUsed, completeCraving, getCravings, updateCravingNotes } from '@/services/cravingService';
import { getDrinkingEvents } from '@/services/drinkService';
import { analyzeInterventionEffectiveness, findSlipPattern } from '@/lib/patterns';
import { getMotivationPhotos, resolvePhotoUri } from '@/services/motivationService';
import { sendCoachMessage } from '@/services/aiService';
import type { SafetyClassification } from '@/lib/safety';
import type { Craving, TriggerTag, InterventionType, DrinkingEvent } from '@/types/domain';

type Step = 'interrupt' | 'intensity' | 'trigger' | 'intervention' | 'recheck' | 'slip' | 'done';

const CRAVING_DURATION_SECONDS = 10 * 60;

export default function CravingMode() {
  const theme = useTheme();
  const router = useRouter();
  const timer = useCountdown(CRAVING_DURATION_SECONDS);

  const [step, setStep] = useState<Step>('interrupt');
  const [intensityBefore, setIntensityBefore] = useState<number | null>(null);
  const [trigger, setTrigger] = useState<TriggerTag | null>(null);
  const [craving, setCraving] = useState<Craving | null>(null);
  const [pastCravings, setPastCravings] = useState<Craving[]>([]);
  const [selectedInterventions, setSelectedInterventions] = useState<InterventionType[]>([]);
  const [intensityAfter, setIntensityAfter] = useState<number | null>(null);
  const [safety, setSafety] = useState<SafetyClassification | null>(null);
  const [saving, setSaving] = useState(false);
  const [pastDrinkingEvents, setPastDrinkingEvents] = useState<DrinkingEvent[]>([]);
  const [slipReflection, setSlipReflection] = useState({ whatHappened: '', whereWasIt: '', wasPlanned: false });
  const [lastOutcome, setLastOutcome] = useState<'resisted' | 'drank' | 'unresolved' | null>(null);

  useEffect(() => {
    getCravings().then(setPastCravings);
    getDrinkingEvents().then(setPastDrinkingEvents);
  }, []);

  const rankedInterventions = useMemo(() => {
    const effectiveness = analyzeInterventionEffectiveness(pastCravings);
    const ranked = [...INTERVENTION_OPTIONS].sort((a, b) => {
      const ea = effectiveness.find((e) => e.type === a.type);
      const eb = effectiveness.find((e) => e.type === b.type);
      return (eb?.resistRate ?? -1) - (ea?.resistRate ?? -1);
    });
    return ranked;
  }, [pastCravings]);

  const similarCount = useMemo(() => {
    if (!trigger) return 0;
    return pastCravings.filter((c) => c.trigger === trigger).length;
  }, [trigger, pastCravings]);

  async function handleIntensitySubmit() {
    if (intensityBefore === null) return;
    const created = await startCraving(intensityBefore, trigger);
    setCraving(created);
    setStep('trigger');
  }

  async function toggleIntervention(type: InterventionType) {
    setSelectedInterventions((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    if (craving) await recordInterventionUsed(craving.id, type);
  }

  async function handleFinish(outcome: 'resisted' | 'drank' | 'unresolved') {
    if (!craving || intensityAfter === null) return;
    setSaving(true);
    await completeCraving(craving.id, intensityAfter, outcome);
    setSaving(false);
    setLastOutcome(outcome);
    setStep(outcome === 'drank' ? 'slip' : 'done');
  }

  const slipPattern = useMemo(() => findSlipPattern({ trigger }, pastDrinkingEvents), [trigger, pastDrinkingEvents]);

  async function handleSlipSubmit() {
    if (!craving) return;
    const summary = [
      slipReflection.whatHappened && `Before: ${slipReflection.whatHappened}`,
      slipReflection.whereWasIt && `Where: ${slipReflection.whereWasIt}`,
      `Planned: ${slipReflection.wasPlanned ? 'yes' : 'no'}`,
    ]
      .filter(Boolean)
      .join(' · ');
    if (summary) {
      const classification = await import('@/services/safetyService').then((m) => m.checkAndLogSafety(summary, 'craving_note'));
      if (classification.level !== 'none') {
        setSafety(classification);
        return;
      }
    }
    if (summary) await updateCravingNotes(craving.id, summary);
    setStep('done');
  }

  if (safety) {
    return <SafetyBanner classification={safety} onDismiss={() => setSafety(null)} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.cravingBg, paddingTop: 60, paddingHorizontal: theme.spacing.lg }}>
      {step !== 'interrupt' && step !== 'done' && (
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
          <Text variant="caption" style={{ color: theme.colors.onDark, opacity: 0.6 }}>
            TIME REMAINING
          </Text>
          <Text variant="heading" style={{ color: theme.colors.onDark }}>
            {timer.formatted}
          </Text>
        </View>
      )}

      {step === 'interrupt' && (
        <InterruptStep timerFormatted={timer.formatted} onContinue={() => setStep('intensity')} onCancel={() => router.back()} />
      )}

      {step === 'intensity' && (
        <View>
          <Text variant="heading" style={{ color: theme.colors.onDark }}>
            How strong is the craving?
          </Text>
          <View style={{ marginTop: theme.spacing.lg }}>
            <IntensityScale
              value={intensityBefore}
              onChange={setIntensityBefore}
              lowLabel="Barely there"
              highLabel="Overwhelming"
              accessibilityLabel="Craving intensity"
            />
          </View>
          <Button
            label="Continue"
            onPress={handleIntensitySubmit}
            disabled={intensityBefore === null}
            fullWidth
            size="lg"
            style={{ marginTop: theme.spacing.xl }}
          />
        </View>
      )}

      {step === 'trigger' && (
        <View>
          <Text variant="heading" style={{ color: theme.colors.onDark }}>
            What's going on right now?
          </Text>
          <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.7, marginTop: theme.spacing.xs }}>
            Optional, but it helps us understand your pattern.
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>
            <ChipGroup>
              {TRIGGER_OPTIONS.map((opt) => (
                <Chip key={opt.tag} label={opt.label} selected={trigger === opt.tag} onPress={() => setTrigger(opt.tag as TriggerTag)} />
              ))}
            </ChipGroup>
          </View>
          <Button label="Continue" onPress={() => setStep('intervention')} fullWidth size="lg" style={{ marginTop: theme.spacing.xl }} />
        </View>
      )}

      {step === 'intervention' && (
        <InterventionStep
          similarCount={similarCount}
          rankedInterventions={rankedInterventions}
          selected={selectedInterventions}
          onToggle={toggleIntervention}
          onSafety={setSafety}
          onDone={() => setStep('recheck')}
        />
      )}

      {step === 'recheck' && (
        <View>
          <Text variant="heading" style={{ color: theme.colors.onDark }}>
            How strong is it now?
          </Text>
          {intensityBefore !== null && (
            <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.7, marginTop: theme.spacing.xs }}>
              You started at {intensityBefore}/10.
            </Text>
          )}
          <View style={{ marginTop: theme.spacing.lg }}>
            <IntensityScale
              value={intensityAfter}
              onChange={setIntensityAfter}
              lowLabel="Gone"
              highLabel="Still overwhelming"
              accessibilityLabel="Current craving intensity"
            />
          </View>

          {intensityAfter !== null && (
            <View style={{ marginTop: theme.spacing.xl, gap: theme.spacing.sm }}>
              <Button label="I got through it" onPress={() => handleFinish('resisted')} loading={saving} fullWidth size="lg" />
              <Button label="I drank" variant="outline" onPress={() => handleFinish('drank')} loading={saving} fullWidth />
              <Button label="Still working through it" variant="ghost" onPress={() => handleFinish('unresolved')} loading={saving} fullWidth />
            </View>
          )}
        </View>
      )}

      {step === 'slip' && (
        <SlipStep
          patternSummary={slipPattern.summary}
          hasPattern={slipPattern.hasPattern}
          reflection={slipReflection}
          onChange={setSlipReflection}
          onSubmit={handleSlipSubmit}
        />
      )}

      {step === 'done' && (
        <DoneStep
          intensityBefore={intensityBefore}
          intensityAfter={intensityAfter}
          wasSlip={lastOutcome === 'drank'}
          patternSummary={lastOutcome === 'drank' && slipPattern.hasPattern ? slipPattern.summary : null}
          onExit={() => router.replace('/(tabs)')}
          onLogSlip={() => router.replace('/(tabs)/log')}
        />
      )}
    </View>
  );
}

function InterruptStep({
  timerFormatted,
  onContinue,
  onCancel,
}: {
  timerFormatted: string;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text variant="display" style={{ color: theme.colors.onDark }} center>
        {timerFormatted}
      </Text>
      <Text variant="title" style={{ color: theme.colors.onDark, marginTop: theme.spacing.lg }} center>
        Pause for 10 minutes.
      </Text>
      <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.8, marginTop: theme.spacing.sm }} center>
        You don't have to decide anything right now. Just breathe. We'll walk through this together.
      </Text>
      <Button label="I'm ready" onPress={onContinue} fullWidth size="lg" style={{ marginTop: theme.spacing.xxl }} />
      <Button label="Never mind" variant="ghost" onPress={onCancel} fullWidth />
    </View>
  );
}

function InterventionStep({
  similarCount,
  rankedInterventions,
  selected,
  onToggle,
  onSafety,
  onDone,
}: {
  similarCount: number;
  rankedInterventions: typeof INTERVENTION_OPTIONS;
  selected: InterventionType[];
  onToggle: (t: InterventionType) => void;
  onSafety: (s: SafetyClassification) => void;
  onDone: () => void;
}) {
  const theme = useTheme();
  const [showWhy, setShowWhy] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [photo, setPhoto] = useState<{ uri: string; description: string } | null>(null);
  const [coachInput, setCoachInput] = useState('');
  const [coachReply, setCoachReply] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);

  async function handleToggle(type: InterventionType) {
    onToggle(type);
    if (type === 'my_why') {
      setShowWhy(true);
      const photos = await getMotivationPhotos();
      if (photos[0]) {
        const uri = await resolvePhotoUri(photos[0]);
        setPhoto({ uri, description: photos[0].description });
      }
    }
    if (type === 'ai_coach') setShowCoach(true);
  }

  async function sendToCoach() {
    if (!coachInput.trim()) return;
    setCoachLoading(true);
    const result = await sendCoachMessage(null, coachInput, 'craving');
    setCoachLoading(false);
    if (result.safety.level !== 'none') {
      onSafety(result.safety);
      return;
    }
    if (result.data?.message) setCoachReply(result.data.message);
    else setCoachReply("I'm having trouble connecting right now — try one of the other strategies below, or reach out to someone you trust.");
    setCoachInput('');
  }

  return (
    <View>
      <Text variant="heading" style={{ color: theme.colors.onDark }}>
        What might help right now?
      </Text>
      {similarCount >= 2 && (
        <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.75, marginTop: theme.spacing.xs }}>
          This looks similar to {similarCount} previous cravings you've gotten through. Here's what's worked best for you:
        </Text>
      )}
      <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
        {rankedInterventions.map((opt) => (
          <Card
            key={opt.type}
            onPress={() => handleToggle(opt.type as InterventionType)}
            style={{
              backgroundColor: selected.includes(opt.type as InterventionType) ? theme.colors.primary : theme.colors.cravingSurface,
              borderWidth: 0,
            }}
          >
            <Text variant="body" style={{ color: selected.includes(opt.type as InterventionType) ? theme.colors.onPrimary : theme.colors.onDark }}>
              {opt.icon} {opt.label}
            </Text>
          </Card>
        ))}
      </View>

      {showWhy && photo && (
        <Card style={{ marginTop: theme.spacing.md, padding: 0, overflow: 'hidden' }}>
          <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 160 }} contentFit="cover" />
          <View style={{ padding: theme.spacing.md }}>
            <Text variant="body">{photo.description}</Text>
          </View>
        </Card>
      )}

      {showCoach && (
        <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.cravingSurface, borderWidth: 0 }}>
          {coachReply && (
            <Text variant="body" style={{ color: theme.colors.onDark, marginBottom: theme.spacing.sm }}>
              {coachReply}
            </Text>
          )}
          <TextField
            placeholder="Tell me what's going on..."
            value={coachInput}
            onChangeText={setCoachInput}
            style={{ color: theme.colors.textPrimary }}
          />
          <Button label="Send" onPress={sendToCoach} loading={coachLoading} disabled={!coachInput.trim()} fullWidth />
        </Card>
      )}

      <Button label="Continue" onPress={onDone} fullWidth size="lg" style={{ marginTop: theme.spacing.xl }} />
    </View>
  );
}

function SlipStep({
  patternSummary,
  hasPattern,
  reflection,
  onChange,
  onSubmit,
}: {
  patternSummary: string;
  hasPattern: boolean;
  reflection: { whatHappened: string; whereWasIt: string; wasPlanned: boolean };
  onChange: (r: { whatHappened: string; whereWasIt: string; wasPlanned: boolean }) => void;
  onSubmit: () => void;
}) {
  const theme = useTheme();
  return (
    <View>
      <Text variant="heading" style={{ color: theme.colors.onDark }}>
        Okay. Let's understand what happened.
      </Text>
      <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.8, marginTop: theme.spacing.xs }}>
        This isn't about blame — it's about learning what led here so we can catch it earlier next time.
      </Text>

      {hasPattern && (
        <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.cravingSurface, borderWidth: 0 }}>
          <Text variant="label" style={{ color: theme.colors.onDark }}>
            What we noticed
          </Text>
          <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.85, marginTop: 4 }}>
            {patternSummary}
          </Text>
        </Card>
      )}

      <View style={{ marginTop: theme.spacing.md }}>
        <TextField
          label="What happened right before?"
          placeholder="Optional"
          value={reflection.whatHappened}
          onChangeText={(v) => onChange({ ...reflection, whatHappened: v })}
        />
        <TextField
          label="Where were you?"
          placeholder="Optional"
          value={reflection.whereWasIt}
          onChangeText={(v) => onChange({ ...reflection, whereWasIt: v })}
        />
        <ChipGroup>
          <Chip label="This was planned" selected={reflection.wasPlanned} onPress={() => onChange({ ...reflection, wasPlanned: true })} />
          <Chip label="This was impulsive" selected={!reflection.wasPlanned} onPress={() => onChange({ ...reflection, wasPlanned: false })} />
        </ChipGroup>
      </View>

      <Button label="Continue" onPress={onSubmit} fullWidth size="lg" style={{ marginTop: theme.spacing.lg }} />
    </View>
  );
}

function DoneStep({
  intensityBefore,
  intensityAfter,
  wasSlip,
  patternSummary,
  onExit,
  onLogSlip,
}: {
  intensityBefore: number | null;
  intensityAfter: number | null;
  wasSlip: boolean;
  patternSummary: string | null;
  onExit: () => void;
  onLogSlip: () => void;
}) {
  const theme = useTheme();
  const improved = intensityBefore !== null && intensityAfter !== null && intensityAfter < intensityBefore;

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Text style={{ fontSize: 48 }} center>
        {wasSlip ? '💛' : improved ? '🌿' : '💛'}
      </Text>
      <Text variant="title" style={{ color: theme.colors.onDark, marginTop: theme.spacing.md }} center>
        That's useful data.
      </Text>
      <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.8, marginTop: theme.spacing.sm }} center>
        {intensityBefore !== null && intensityAfter !== null
          ? `Your craving went from ${intensityBefore}/10 to ${intensityAfter}/10. Whatever happened, you showed up for yourself by working through this.`
          : 'Whatever happened, you showed up for yourself by working through this.'}
      </Text>
      {wasSlip && patternSummary && (
        <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.cravingSurface, borderWidth: 0 }}>
          <Text variant="label" style={{ color: theme.colors.onDark }}>
            Next time
          </Text>
          <Text variant="body" style={{ color: theme.colors.onDark, opacity: 0.85, marginTop: 4 }}>
            {patternSummary} Consider reaching for an intervention earlier next time this pattern starts.
          </Text>
        </Card>
      )}
      {wasSlip && (
        <Button label="Log the drink for accurate tracking" onPress={onLogSlip} fullWidth style={{ marginTop: theme.spacing.lg }} />
      )}
      <Button label="Back to dashboard" onPress={onExit} fullWidth size="lg" style={{ marginTop: theme.spacing.sm }} />
    </View>
  );
}
