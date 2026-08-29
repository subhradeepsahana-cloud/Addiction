// Offline mirror of supabase/migrations/0012_health_knowledge_seed.sql so
// Health & Science works fully without a backend. When Supabase is
// configured, the live health_articles table is used instead (see
// app/(tabs)/more/health/index.tsx).

export interface HealthArticle {
  slug: string;
  title: string;
  summary: string;
  content: string;
  evidenceLevel: 'high' | 'moderate' | 'emerging';
  sourceName: string;
  sourceUrl: string;
}

export const HEALTH_ARTICLES: HealthArticle[] = [
  {
    slug: 'alcohol-general-risk',
    title: 'How alcohol affects overall health',
    summary: 'Public health authorities including WHO have stated that no level of alcohol consumption has been shown to be risk-free for health.',
    content:
      'Alcohol is classified as a Group 1 carcinogen and is linked to more than 200 disease and injury conditions. Public health guidance from the World Health Organization states that no level of alcohol consumption has been shown to be without risk to health — risk increases with the amount consumed, but even low levels carry some risk. This is population-level guidance, not an individual medical assessment; if you have questions about your own health, speak with a doctor.',
    evidenceLevel: 'high',
    sourceName: 'World Health Organization',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/alcohol',
  },
  {
    slug: 'alcohol-and-sleep',
    title: 'Alcohol and sleep',
    summary: 'Alcohol can make it easier to fall asleep initially but tends to disrupt sleep quality later in the night.',
    content:
      'Alcohol is a sedative, so it can shorten the time it takes to fall asleep. However, as the body metabolizes alcohol overnight, it commonly disrupts the second half of the sleep cycle, reducing REM sleep and increasing awakenings. Regular heavy drinking is associated with poorer overall sleep quality over time.',
    evidenceLevel: 'moderate',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health',
  },
  {
    slug: 'alcohol-and-liver-health',
    title: 'Alcohol and liver health',
    summary: 'Sustained heavy drinking is a well-established risk factor for liver disease, including fatty liver, hepatitis, and cirrhosis.',
    content:
      'The liver processes most of the alcohol consumed, and sustained heavy use can lead to a progression of liver damage: fatty liver (often reversible with reduced drinking), alcoholic hepatitis, fibrosis, and eventually cirrhosis in some individuals. Reducing or stopping alcohol use is associated with improved liver health outcomes at earlier stages.',
    evidenceLevel: 'high',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohols-effects-body',
  },
  {
    slug: 'alcohol-and-cardiovascular-health',
    title: 'Alcohol and cardiovascular health',
    summary: 'Heavy or binge drinking is associated with increased risk of high blood pressure, irregular heart rhythms, and cardiomyopathy.',
    content:
      'Drinking too much alcohol, including binge drinking, can raise blood pressure and contribute to cardiomyopathy, arrhythmias (such as atrial fibrillation), and stroke risk over time. This app does not claim there is a "safe" drinking level for heart health — speak with a doctor about your individual risk.',
    evidenceLevel: 'moderate',
    sourceName: 'CDC',
    sourceUrl: 'https://www.cdc.gov/alcohol/facts-stats/index.html',
  },
  {
    slug: 'alcohol-and-cancer-risk',
    title: 'Alcohol and cancer risk',
    summary: 'Alcohol consumption is an established risk factor for several types of cancer, with risk increasing with the amount consumed.',
    content:
      'Alcohol is classified by the International Agency for Research on Cancer as a Group 1 carcinogen, an established risk factor for cancers of the mouth, throat, esophagus, liver, colorectum, and breast, among others. Risk generally increases with the amount and duration of consumption.',
    evidenceLevel: 'high',
    sourceName: 'World Health Organization',
    sourceUrl: 'https://www.who.int/news-room/fact-sheets/detail/alcohol',
  },
  {
    slug: 'alcohol-and-mental-health',
    title: 'Alcohol and mental health',
    summary: 'Alcohol can worsen anxiety and depression symptoms over time, even though it may feel temporarily calming.',
    content:
      'While alcohol can produce short-term feelings of relaxation, regular use is associated with worsened anxiety and depressive symptoms over time. This app is not a substitute for mental health care — if you are struggling, consider speaking with a mental health professional.',
    evidenceLevel: 'moderate',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-and-mental-health',
  },
  {
    slug: 'alcohol-dependence-overview',
    title: 'Understanding alcohol dependence',
    summary: 'Alcohol use disorder exists on a spectrum and is a recognized, treatable medical condition — not a matter of willpower alone.',
    content:
      'Alcohol use disorder (AUD) is a medical diagnosis made by a qualified clinician. It exists on a spectrum from mild to severe and is treatable. This app does not diagnose AUD — a doctor or addiction specialist can provide a proper assessment.',
    evidenceLevel: 'high',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder',
  },
  {
    slug: 'alcohol-withdrawal-overview',
    title: 'Alcohol withdrawal: why medical guidance matters',
    summary: 'For people who drink heavily and regularly, stopping suddenly can carry serious health risks and may require medical supervision.',
    content:
      'Stopping or sharply reducing intake suddenly after prolonged heavy drinking can trigger withdrawal symptoms ranging from mild to severe and potentially life-threatening (seizures, hallucinations, delirium tremens). Anyone who drinks heavily on a regular basis and wants to stop should talk to a doctor first about doing so safely. This app does not manage alcohol withdrawal.',
    evidenceLevel: 'high',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health/alcohol-use-disorder',
  },
  {
    slug: 'binge-drinking-definition',
    title: 'What counts as binge drinking',
    summary: 'Typically around 5+ drinks for men or 4+ drinks for women within about 2 hours.',
    content:
      'The CDC and NIAAA commonly define binge drinking as a pattern that brings blood alcohol concentration to 0.08g/dL or higher — typically 5+ drinks for men, or 4+ for women, within about 2 hours. This is a population-level reference definition, not an individualized medical threshold.',
    evidenceLevel: 'high',
    sourceName: 'CDC',
    sourceUrl: 'https://www.cdc.gov/alcohol/binge-drinking/index.html',
  },
  {
    slug: 'alcohol-and-calories',
    title: 'Alcohol and calories',
    summary: 'Alcoholic drinks contain calories from alcohol itself in addition to any calories from sugar or mixers.',
    content:
      'Pure alcohol provides about 7 calories per gram — more than carbohydrate or protein and close to fat — often called "empty calories". Sweetened cocktails and mixers add further calories on top.',
    evidenceLevel: 'high',
    sourceName: 'NIAAA',
    sourceUrl: 'https://www.niaaa.nih.gov/alcohols-effects-health/overview-alcohol-consumption',
  },
  {
    slug: 'benefits-of-reducing-alcohol',
    title: 'What can improve when you cut back on alcohol',
    summary: 'Better sleep quality, more stable mood, and more energy are commonly reported — timelines vary by individual.',
    content:
      'Cutting back on alcohol can lead to noticeable improvements for many people: better sleep quality, improved mood stability, more energy, and — over the longer term — reduced risk for a range of alcohol-related health conditions. What improves, and how quickly, varies significantly between individuals.',
    evidenceLevel: 'moderate',
    sourceName: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/alcohol-advice/',
  },
  {
    slug: 'when-to-seek-professional-help',
    title: 'When to seek professional help',
    summary: "If drinking is affecting your health, relationships, work, or safety, it's appropriate to speak with a doctor.",
    content:
      "Seek professional help if alcohol is affecting your health, work, or relationships; you've tried to cut down and found it difficult; you experience withdrawal symptoms when you don't drink; you drink heavily and want to stop; or you have thoughts of harming yourself. This app is a behavioral support tool and does not replace professional care.",
    evidenceLevel: 'high',
    sourceName: 'NHS',
    sourceUrl: 'https://www.nhs.uk/live-well/alcohol-advice/getting-help-for-alcohol-misuse/',
  },
];
