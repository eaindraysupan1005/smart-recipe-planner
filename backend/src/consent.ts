import { db, newId, now, persist } from './db.js';
import type { AcceptanceRecord, RecordKind } from './types.js';

export const VERSIONS: Record<RecordKind, string> = {
  terms: 'v1.2',
  disclaimer: 'v1.0',
  ai_consent: 'v1.1',
  diet_consent: 'v1.0',
  diet_filter: 'v1.0',
};

export function addRecord(
  userId: string,
  kind: RecordKind,
  action: 'granted' | 'withdrawn',
  detail?: string,
): AcceptanceRecord {
  const rec: AcceptanceRecord = { id: newId(), userId, kind, action, version: VERSIONS[kind], detail, at: now() };
  db.records.push(rec);
  persist();
  return rec;
}

/** The latest record of a kind decides whether consent is currently active. */
export function isActive(userId: string, kind: RecordKind, detail?: string): boolean {
  const latest = db.records
    .filter((r) => r.userId === userId && r.kind === kind && (detail === undefined || r.detail === detail))
    .at(-1);
  return latest?.action === 'granted';
}

export function consentState(userId: string) {
  const ai = db.records.filter((r) => r.userId === userId && r.kind === 'ai_consent').at(-1);
  return {
    aiConsent: ai?.action === 'granted',
    aiConsentAt: ai?.action === 'granted' ? ai.at : null,
    dietConsent: isActive(userId, 'diet_consent'),
  };
}
