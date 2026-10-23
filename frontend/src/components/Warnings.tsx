import type { Warning } from '../api';

/**
 * Allergen and dietary flags. Recipes are never hidden because of these —
 * the cook sees what a dish contains and decides for themselves.
 */
export function WarningList({ warnings, compact = false }: { warnings: Warning[] | undefined; compact?: boolean }) {
  if (!warnings?.length) return null;
  const serious = warnings.filter((w) => w.severity !== 'info');
  const info = warnings.filter((w) => w.severity === 'info');

  if (compact) {
    return (
      <div className="pills" style={{ marginTop: 9 }}>
        {serious.map((w) => (
          <span key={w.key} className={`warn-chip ${w.severity}`}>
            {w.severity === 'allergy' ? '⚠️' : '!'} {w.label}
          </span>
        ))}
        {info.map((w) => (
          <span key={w.key} className="warn-chip info">{w.label}</span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 14 }}>
      {serious.map((w) => (
        <div key={w.key} className={`warn-box ${w.severity}`} role={w.severity === 'allergy' ? 'alert' : undefined}>
          <span className="warn-icon" aria-hidden>{w.severity === 'allergy' ? '⚠️' : '!'}</span>
          <span>
            <strong>{w.label}</strong>
            <span style={{ display: 'block', marginTop: 2, opacity: 0.85 }}>From: {w.ingredients.join(', ')}</span>
          </span>
        </div>
      ))}
      {info.length > 0 && (
        <div className="warn-box info">
          <span className="warn-icon" aria-hidden>ⓘ</span>
          <span>
            <strong>Also contains:</strong> {info.map((w) => w.label.replace(/^Contains /, '')).join(', ')}
            <span style={{ display: 'block', marginTop: 2, opacity: 0.85 }}>Worth checking if you are cooking for someone else.</span>
          </span>
        </div>
      )}
    </div>
  );
}

/** The one-line version for a list row: only the serious flags. */
export function WarningBadge({ warnings }: { warnings: Warning[] | undefined }) {
  const serious = warnings?.filter((w) => w.severity !== 'info') ?? [];
  if (!serious.length) return null;
  const worst = serious[0];
  return (
    <span className={`warn-chip ${worst.severity}`} style={{ marginTop: 9, display: 'inline-block' }}>
      {worst.severity === 'allergy' ? '⚠️' : '!'} {worst.label}
      {serious.length > 1 ? ` +${serious.length - 1}` : ''}
    </span>
  );
}
