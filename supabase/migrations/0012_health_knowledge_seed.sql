-- Seed data for the Scientific Knowledge System. Content is deliberately
-- conservative and general — it summarizes widely published public-health
-- positions from each organization's own site rather than citing specific
-- papers, since specific studies/URLs cannot be verified from this
-- migration. Before production launch, a human reviewer should open each
-- source_url, confirm it still resolves to the relevant content, and
-- update `last_verified_date` (see docs/KNOWLEDGE_SOURCES.md).

insert into public.health_sources (name, short_code, url) values
  ('World Health Organization', 'WHO', 'https://www.who.int'),
  ('National Institute on Alcohol Abuse and Alcoholism', 'NIAAA', 'https://www.niaaa.nih.gov'),
  ('Centers for Disease Control and Prevention', 'CDC', 'https://www.cdc.gov'),
  ('National Health Service (UK)', 'NHS', 'https://www.nhs.uk')
on conflict (short_code) do nothing;

-- Helper to keep the insert statements below readable.
do $$
declare
  who_id uuid; niaaa_id uuid; cdc_id uuid; nhs_id uuid;
begin
  select id into who_id from public.health_sources where short_code = 'WHO';
  select id into niaaa_id from public.health_sources where short_code = 'NIAAA';
  select id into cdc_id from public.health_sources where short_code = 'CDC';
  select id into nhs_id from public.health_sources where short_code = 'NHS';

  insert into public.health_articles (source_id, topic, title, slug, summary, content, evidence_level, source_url, last_verified_date)
  values
  (
    who_id, 'general_risk', 'How alcohol affects overall health',
    'alcohol-general-risk',
    'Public health authorities including WHO have stated that no level of alcohol consumption has been shown to be risk-free for health.',
    'Alcohol is classified as a Group 1 carcinogen and is linked to more than 200 disease and injury conditions. Public health guidance from the World Health Organization states that no level of alcohol consumption has been shown to be without risk to health — risk increases with the amount consumed, but even low levels carry some risk. This is population-level guidance, not an individual medical assessment; if you have questions about your own health, speak with a doctor.',
    'high', 'https://www.who.int/news-room/fact-sheets/detail/alcohol', current_date
  ),
  (
    niaaa_id, 'sleep', 'Alcohol and sleep',
    'alcohol-and-sleep',
    'Alcohol can make it easier to fall asleep initially but tends to disrupt sleep quality later in the night.',
    'Alcohol is a sedative, so it can shorten the time it takes to fall asleep. However, as the body metabolizes alcohol overnight, it commonly disrupts the second half of the sleep cycle, reducing REM sleep and increasing awakenings. Regular heavy drinking is associated with poorer overall sleep quality over time. Individual responses vary, and this is general information rather than a diagnosis of any particular sleep condition.',
    'moderate', 'https://www.niaaa.nih.gov/alcohols-effects-health', current_date
  ),
  (
    niaaa_id, 'liver', 'Alcohol and liver health',
    'alcohol-and-liver-health',
    'Sustained heavy drinking is a well-established risk factor for liver disease, including fatty liver, hepatitis, and cirrhosis.',
    'The liver processes most of the alcohol consumed, and sustained heavy use can lead to a progression of liver damage: fatty liver (often reversible with reduced drinking), alcoholic hepatitis, fibrosis, and eventually cirrhosis in some individuals. Risk depends on amount, duration, and individual factors. Reducing or stopping alcohol use is associated with improved liver health outcomes at earlier stages. This is general information, not a diagnosis — liver health should be assessed by a medical professional.',
    'high', 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohols-effects-body', current_date
  ),
  (
    cdc_id, 'cardiovascular', 'Alcohol and cardiovascular health',
    'alcohol-and-cardiovascular-health',
    'Heavy or binge drinking is associated with increased risk of high blood pressure, irregular heart rhythms, and cardiomyopathy.',
    'Public health guidance from the CDC notes that drinking too much alcohol, including binge drinking, can raise blood pressure and contribute to cardiomyopathy, arrhythmias (such as atrial fibrillation), and stroke risk over time. Any potential cardiovascular effects of low-level drinking are actively debated in the research community and guidance continues to evolve — this app does not make claims about a "safe" drinking level for heart health. Speak with a doctor about your individual cardiovascular risk.',
    'moderate', 'https://www.cdc.gov/alcohol/facts-stats/index.html', current_date
  ),
  (
    who_id, 'cancer_risk', 'Alcohol and cancer risk',
    'alcohol-and-cancer-risk',
    'Alcohol consumption is a established risk factor for several types of cancer, with risk increasing with the amount consumed.',
    'Alcohol is classified by the International Agency for Research on Cancer as a Group 1 carcinogen. It is an established risk factor for cancers of the mouth, throat, esophagus, liver, colorectum, and breast, among others. Risk generally increases with the amount and duration of consumption; there is no threshold below which no risk exists. This is general population-level evidence, not an individual risk assessment.',
    'high', 'https://www.who.int/news-room/fact-sheets/detail/alcohol', current_date
  ),
  (
    niaaa_id, 'mental_health', 'Alcohol and mental health',
    'alcohol-and-mental-health',
    'Alcohol use and mental health commonly interact in both directions — alcohol can worsen anxiety and depression symptoms over time, even though it may feel temporarily calming.',
    'While alcohol can produce short-term feelings of relaxation, regular use is associated with worsened anxiety and depressive symptoms over time, and can interfere with the effectiveness of some mental health treatments and medications. The relationship between alcohol and mental health differs from person to person. This app is not a substitute for mental health care — if you are struggling, consider speaking with a mental health professional.',
    'moderate', 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-and-mental-health', current_date
  ),
  (
    niaaa_id, 'dependence', 'Understanding alcohol dependence',
    'alcohol-dependence-overview',
    'Alcohol use disorder exists on a spectrum and is a recognized, treatable medical condition — not a matter of willpower alone.',
    'Alcohol use disorder (AUD) is a medical diagnosis made by a qualified clinician, generally based on criteria such as those in the DSM-5, evaluating patterns of use and their impact on a person''s life over time. It exists on a spectrum from mild to severe and is a recognized, treatable condition. This app does not diagnose AUD. If you''re concerned about your own drinking, a doctor or addiction specialist can provide a proper assessment and discuss treatment options, which may include therapy, support groups, and/or medication.',
    'high', 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder', current_date
  ),
  (
    niaaa_id, 'withdrawal', 'Alcohol withdrawal: why medical guidance matters',
    'alcohol-withdrawal-overview',
    'For people who drink heavily and regularly, stopping suddenly can carry serious health risks and may require medical supervision.',
    'For someone who has been drinking heavily and consistently over a long period, the body can become physically dependent on alcohol. Stopping or sharply reducing intake suddenly can trigger withdrawal symptoms ranging from mild (anxiety, sweating, tremor) to severe and potentially life-threatening (seizures, hallucinations, delirium tremens). Anyone who drinks heavily on a regular basis and wants to stop should talk to a doctor first about doing so safely — medically supervised approaches exist specifically to reduce these risks. This app does not manage alcohol withdrawal and is not a substitute for medical care.',
    'high', 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder', current_date
  ),
  (
    cdc_id, 'binge_drinking', 'What counts as binge drinking',
    'binge-drinking-definition',
    'Binge drinking is commonly defined as a pattern that brings blood alcohol concentration to 0.08g/dL or higher, typically around 5+ drinks for men or 4+ drinks for women within about 2 hours.',
    'The CDC and NIAAA commonly define binge drinking as a pattern of drinking that brings a person''s blood alcohol concentration to 0.08 grams percent or above — typically corresponding to men consuming 5 or more drinks, or women consuming 4 or more drinks, within about 2 hours. Binge drinking is associated with increased short-term risks (injury, alcohol poisoning) and long-term health risks. These are population-level reference definitions, not individualized medical thresholds.',
    'high', 'https://www.cdc.gov/alcohol/binge-drinking/index.html', current_date
  ),
  (
    niaaa_id, 'calories', 'Alcohol and calories',
    'alcohol-and-calories',
    'Alcoholic drinks contain calories from alcohol itself (about 7 calories per gram) in addition to any calories from sugar or mixers.',
    'Pure alcohol provides about 7 calories per gram — more than carbohydrate or protein (4 cal/g) and close to fat (9 cal/g) — and these are often called "empty calories" because alcohol provides energy without significant nutrients. Sweetened cocktails and mixers add further calories on top of the alcohol itself. Reducing alcohol intake is one factor, among many, that can support broader health and weight goals.',
    'high', 'https://www.niaaa.nih.gov/alcohols-effects-health/overview-alcohol-consumption', current_date
  ),
  (
    nhs_id, 'benefits_of_reducing', 'What can improve when you cut back on alcohol',
    'benefits-of-reducing-alcohol',
    'People who reduce or stop drinking commonly report improvements such as better sleep quality, more stable mood, and more energy — timelines vary by individual.',
    'Public health guidance from the NHS notes that cutting back on alcohol can lead to noticeable improvements for many people, including better sleep quality, improved mood stability, more energy, clearer skin, and — over the longer term — reduced risk for a range of alcohol-related health conditions. Exactly what improves, and how quickly, varies significantly between individuals and depends on prior drinking patterns and overall health. This app avoids promising a specific timeline for any individual.',
    'moderate', 'https://www.nhs.uk/live-well/alcohol-advice/', current_date
  ),
  (
    nhs_id, 'when_to_seek_help', 'When to seek professional help',
    'when-to-seek-professional-help',
    'If drinking is affecting your health, relationships, work, or safety — or if you experience withdrawal symptoms when you try to cut down — it''s appropriate to speak with a doctor.',
    'It is appropriate to seek professional help if: alcohol is affecting your health, work, or relationships; you''ve tried to cut down and found it difficult; you experience withdrawal symptoms (shaking, sweating, anxiety, nausea) when you don''t drink; you drink heavily and regularly and want to stop (medical guidance is especially important before stopping suddenly); or you have any thoughts of harming yourself. A doctor, addiction specialist, or local support service can provide a proper assessment and discuss safe options. This app is a behavioral support tool and does not replace professional care.',
    'high', 'https://www.nhs.uk/live-well/alcohol-advice/getting-help-for-alcohol-misuse/', current_date
  )
  on conflict (slug) do nothing;
end $$;
