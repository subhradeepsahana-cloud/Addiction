// Country-specific emergency resources shown by the Safety engine (Section
// 19-20, 32). This list is intentionally small and limited to widely known,
// stable national numbers. It is configurable (Settings → Safety Country)
// and should be reviewed periodically — see docs/SAFETY.md.

export interface EmergencyResourceSet {
  countryCode: string;
  countryName: string;
  emergencyNumber: string;
  emergencyLabel: string;
  crisisLine: { name: string; contact: string } | null;
  alcoholSupportLine: { name: string; contact: string } | null;
}

export const EMERGENCY_RESOURCES: Record<string, EmergencyResourceSet> = {
  US: {
    countryCode: 'US',
    countryName: 'United States',
    emergencyNumber: '911',
    emergencyLabel: 'Call 911 for a medical emergency',
    crisisLine: { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988' },
    alcoholSupportLine: { name: 'SAMHSA National Helpline', contact: '1-800-662-4357' },
  },
  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    emergencyNumber: '999',
    emergencyLabel: 'Call 999 for a medical emergency (111 for urgent, non-emergency help)',
    crisisLine: { name: 'Samaritans', contact: 'Call 116 123 (free, 24/7)' },
    alcoholSupportLine: { name: 'Drinkline', contact: '0300 123 1110' },
  },
  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    emergencyNumber: '911',
    emergencyLabel: 'Call 911 for a medical emergency',
    crisisLine: { name: 'Talk Suicide Canada', contact: 'Call or text 988' },
    alcoholSupportLine: { name: 'Canadian Centre on Substance Use and Addiction', contact: 'ccsa.ca' },
  },
  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    emergencyNumber: '000',
    emergencyLabel: 'Call 000 for a medical emergency',
    crisisLine: { name: 'Lifeline Australia', contact: '13 11 14' },
    alcoholSupportLine: { name: 'National Alcohol and Other Drug Hotline', contact: '1800 250 015' },
  },
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    emergencyNumber: '112',
    emergencyLabel: 'Call 112 for a medical emergency',
    crisisLine: { name: 'iCall (TISS)', contact: '9152987821' },
    alcoholSupportLine: null,
  },
  INTL: {
    countryCode: 'INTL',
    countryName: 'International',
    emergencyNumber: 'your local emergency number',
    emergencyLabel: 'Contact your local emergency services',
    crisisLine: { name: 'International Association for Suicide Prevention', contact: 'findahelpline.com' },
    alcoholSupportLine: null,
  },
};

export function getEmergencyResources(countryCode: string): EmergencyResourceSet {
  return EMERGENCY_RESOURCES[countryCode] ?? EMERGENCY_RESOURCES.INTL;
}

export const SUPPORTED_EMERGENCY_COUNTRIES = Object.keys(EMERGENCY_RESOURCES);
