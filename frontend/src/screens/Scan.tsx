import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, ApiError, fmtDateTime, fmtQty, type ScannedLine } from '../api';
import { useApp } from '../state';
import { readReceipt, SAMPLE_RECEIPT, stripPrivate } from '../ocr';
import { Back, Sheet, TabScreen, UNITS, UnitSelect } from '../components/ui';
import { Camera, type CameraHandle, type CameraState } from '../components/Camera';

/** Marker for the demo receipt (no photo, same parsing path). */
const SAMPLE = 'sample';

/** Reads a picked photo into memory (it stays on the phone). */
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Could not open that photo.'));
    r.readAsDataURL(file);
  });
}

/** S1 — live camera with the receipt frame; native picker as a fallback. */
export function Scan() {
  const nav = useNavigate();
  const { setScanImage, setScanDraft } = useApp();
  const cam = useRef<CameraHandle>(null);
  const nativeCamera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const [camState, setCamState] = useState<CameraState>('starting');
  const [hasTorch, setHasTorch] = useState(false);
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState('');

  const start = (image: string | null) => {
    setScanImage(image);
    setScanDraft(null);
    nav('/scan/reading');
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      start(await readFile(f));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const shoot = () => {
    if (camState !== 'live') {
      nativeCamera.current?.click();
      return;
    }
    const shot = cam.current?.capture();
    if (!shot) {
      setError('The camera is still warming up — try again.');
      return;
    }
    setFlash(true);
    window.setTimeout(() => start(shot), 160);
  };

  const live = camState === 'live';
  const note =
    camState === 'denied'
      ? 'Camera access is blocked. Allow it in your browser settings, or tap the button to use your phone camera.'
      : camState === 'unavailable'
        ? 'No live camera here. Tap the button to take or choose a photo.'
        : 'Lay the receipt flat and fit it inside the frame. Good light helps — long receipts can be scanned in two photos.';

  return (
    <div className="screen dark">
      <div className="pad topbar">
        <Back to="/pantry" dark />
        <div className="title" style={{ color: '#fff' }}>Scan receipt</div>
        {live && hasTorch && (
          <button className="link" style={{ color: '#fff', textDecoration: 'none' }} onClick={() => cam.current?.toggleTorch()} aria-label="Toggle flash">
            ⚡ Flash
          </button>
        )}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.62)', padding: '12px 22px 0' }}>{note}</div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
        <div style={{ width: '100%', aspectRatio: '3/4', maxHeight: '52dvh', borderRadius: 18, background: 'rgba(255,255,255,0.06)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Camera
            ref={cam}
            onState={(s, info) => {
              setCamState(s);
              setHasTorch(info.torch);
            }}
          />
          {!live && (
            <div style={{ width: '62%', height: '78%', borderRadius: 6, background: 'rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', gap: 7, padding: '16px 14px', position: 'relative' }}>
              {[70, 45, 0, 90, 82, 88, 60].map((w, i) =>
                w === 0 ? (
                  <div key={i} style={{ height: 1, background: 'rgba(255,255,255,0.2)', margin: '5px 0' }} />
                ) : (
                  <div key={i} style={{ height: i === 0 ? 8 : 6, width: `${w}%`, borderRadius: 99, background: `rgba(255,255,255,${i === 0 ? 0.35 : 0.22})` }} />
                ),
              )}
            </div>
          )}
          <div style={{ position: 'absolute', inset: 16, border: '2px solid var(--yellow)', borderRadius: 12, pointerEvents: 'none' }} />
          <div className="scanline" style={{ position: 'absolute', left: 16, right: 16, height: 2, background: 'var(--yellow)', boxShadow: '0 0 18px 4px rgba(255,201,29,0.5)' }} />
          {camState === 'starting' && <div style={{ position: 'absolute', bottom: 28, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>Starting camera…</div>}
          {flash && <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.7 }} />}
        </div>
      </div>

      <div style={{ padding: '0 22px 30px' }}>
        <div style={{ fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
          The photo is read on your phone and never uploaded. Store name, card digits and totals are removed before the item lines are sent.
        </div>
        {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn-outline" style={{ flex: 1, borderColor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => library.current?.click()}>
            Choose photo
          </button>
          <button aria-label="Take photo" onClick={shoot} style={{ flex: '0 0 74px', width: 74, height: 74, borderRadius: 99, background: 'var(--yellow)', border: '5px solid rgba(255,255,255,0.2)' }} />
          <button className="btn-outline" style={{ flex: 1, border: 0, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }} onClick={() => nav('/pantry')}>
            Cancel
          </button>
        </div>
        <button className="muted-link" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', fontSize: 13 }} onClick={() => start(SAMPLE)}>
          No receipt handy? Use a sample receipt
        </button>
        <input ref={nativeCamera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <input ref={library} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>
    </div>
  );
}

/** S2 — on-device OCR, private-line removal, then server-side food matching. */
export function ScanReading() {
  const nav = useNavigate();
  const { scanImage, setScanImage, scanDraft, setScanDraft } = useApp();
  const [stage, setStage] = useState(0); // 0 prepare · 1 read · 2 strip · 3 match · 4 done
  const [ocrPct, setOcrPct] = useState(0);
  const [info, setInfo] = useState<{ textLines: number; removed: number } | null>(null);
  const [error, setError] = useState('');
  const started = useRef(false);
  const image = useRef(scanImage);
  const [thumb] = useState(scanImage !== SAMPLE ? scanImage : null); // in memory only

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // Nothing to read (e.g. the page was refreshed): back to the camera.
    if (!image.current) {
      nav('/scan', { replace: true });
      return;
    }
    setScanImage(null); // the photo lives only in this screen's memory
    (async () => {
      try {
        let all: string[];
        let textLines: number;
        let lines: string[];
        let removed: number;
        if (image.current !== SAMPLE) {
          setStage(1);
          const r = await readReceipt(image.current!, (p) => setOcrPct(p.stage === 'loading' ? p.progress * 0.15 : 0.15 + p.progress * 0.85));
          ({ lines, textLines, removed } = r);
        } else {
          all = SAMPLE_RECEIPT;
          textLines = all.length;
          ({ kept: lines, removed } = stripPrivate(all));
        }
        image.current = null;
        setInfo({ textLines, removed });
        setStage(3);
        const res = lines.length ? await api.scan(lines) : { scannedAt: new Date().toISOString(), items: [] };
        setScanDraft({ ...res, textLines, removed });
        setStage(4);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'We could not read that photo. Try again in better light.');
      }
    })();
  }, [nav, setScanDraft, setScanImage]);

  const done = stage >= 4 && !!scanDraft;
  const pct = done ? 100 : stage <= 1 ? 5 + ocrPct * 80 : 90;
  const found = scanDraft?.items.length ?? 0;

  const steps = [
    'Photo kept on your phone',
    stage === 1 ? `Reading text on your phone… ${Math.round(ocrPct * 100)}%` : info ? `${info.textLines} text lines found` : 'Reading text on your phone',
    info ? `Store name, card digits and totals removed (${info.removed} lines)` : 'Store name, card digits and totals removed',
    'Matching lines to food items',
  ];

  return (
    <div className="screen">
      <div className="pad-all">
        <div className="topbar">
          <Back to="/scan" />
          <div className="title">Reading your receipt</div>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 28, alignItems: 'flex-start' }}>
          {thumb ? (
            <img src={thumb} alt="Your receipt" style={{ flex: '0 0 92px', width: 92, height: 124, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(27,26,23,0.1)' }} />
          ) : (
            <div style={{ flex: '0 0 92px', width: 92, height: 124, borderRadius: 10, background: 'var(--sand)', border: '1px solid rgba(27,26,23,0.1)', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[75, 50, 0, 92, 85, 90, 64].map((w, i) =>
                w === 0 ? <div key={i} style={{ height: 1, background: 'rgba(27,26,23,0.12)', margin: '3px 0' }} /> : <div key={i} style={{ height: i === 0 ? 6 : 5, width: `${w}%`, borderRadius: 99, background: `rgba(27,26,23,${i === 0 ? 0.22 : 0.14})` }} />,
              )}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.25 }}>
              {done ? (found ? `${found} items found` : 'No items found') : 'Extracting items'}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink-60)', marginTop: 6 }}>
              {done && !found
                ? "We couldn't make out any food lines. Flatten the receipt, use brighter light, and fill the frame."
                : 'The first scan downloads the reader (a few seconds). You confirm everything before it lands in your pantry.'}
            </div>
            <div className="progress" style={{ marginTop: 16 }}>
              <div style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 30 }}>
          {steps.map((s, i) => {
            const state = error && i === stage ? 'todo' : i < stage || done ? 'ok' : i === stage ? 'now' : 'todo';
            return (
              <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
                <div className={`dot ${state}`}>{state === 'ok' ? '✓' : state === 'now' ? '•' : ''}</div>
                <div style={{ fontSize: 14.5, fontWeight: state === 'now' ? 600 : 400, color: state === 'todo' ? 'var(--ink-45)' : 'var(--ink)' }}>{s}</div>
              </div>
            );
          })}
        </div>

        {error && <div className="error" style={{ marginTop: 20 }}>{error}</div>}
        <div className="grow" />
        {done && !found ? (
          <>
            <button className="btn" onClick={() => nav('/scan', { replace: true })}>Retake photo</button>
            <button className="muted-link" onClick={() => nav('/pantry/add')}>Add items by hand</button>
          </>
        ) : error ? (
          <button className="btn" onClick={() => nav('/scan', { replace: true })}>Try again</button>
        ) : (
          <>
            <button className="btn" disabled={!done} onClick={() => nav('/scan/review', { replace: true })}>
              {done ? 'See what we found' : 'Reading…'}
            </button>
            <button className="muted-link" onClick={() => { setScanDraft(null); nav('/scan'); }}>Cancel scan</button>
          </>
        )}
      </div>
    </div>
  );
}

/** S3 — review extracted lines (S4 edit sheet), then add them in one go. */
export function ScanReview() {
  const nav = useNavigate();
  const { scanDraft, setScanDraft, showToast } = useApp();
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const committed = useRef(false);

  if (!scanDraft) return committed.current ? null : <Navigate to="/scan" replace />;
  const { items, scannedAt } = scanDraft;

  const commit = async () => {
    setBusy(true);
    setError('');
    try {
      await api.addItems(items.map(({ name, qty, unit }) => ({ name, qty, unit })), scannedAt);
      committed.current = true;
      setScanDraft(null);
      showToast(`${items.length} items added to your pantry`);
      nav('/pantry');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add the items.');
    } finally {
      setBusy(false);
    }
  };

  const update = (i: number, line: ScannedLine | null) =>
    setScanDraft((d) => (d ? { ...d, items: line ? d.items.map((x, j) => (j === i ? line : x)) : d.items.filter((_, j) => j !== i) } : d));

  return (
    <TabScreen>
      <div className="pad">
        <div className="topbar">
          <Back to="/scan" />
          <div className="title" style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>{items.length} items found</div>
          <button className="link" onClick={() => nav('/scan')}>Rescan</button>
        </div>

        <div className="note" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '13px 15px' }}>
          <div style={{ flex: '0 0 20px', width: 20, height: 20, borderRadius: 6, background: 'var(--ink)', color: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>🕘</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>Scanned {fmtDateTime(scannedAt)}</div>
            <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--ink-60)', marginTop: 2 }}>Every item is saved with this date, so you always know how long it has been in your pantry.</div>
          </div>
        </div>

        <div className="section">
          <span>Items from this receipt</span>
        </div>
        {items.length ? (
          <div className="card">
            {items.map((x, i) => (
              <div key={`${x.raw}-${i}`} className="row clickable" onClick={() => setEditIdx(i)}>
                <span className="check on">✓</span>
                <div className="main">
                  <div className="name" style={{ fontWeight: 600 }}>{x.name}</div>
                  <div className="meta">
                    {fmtQty(x.qty, x.unit)}
                    {x.alreadyHave ? ' · adds to what you have' : ''}
                    {!x.confident && <span style={{ color: 'var(--red)', fontWeight: 600 }}> · check this</span>}
                  </div>
                </div>
                <span style={{ padding: '6px 11px', borderRadius: 9, border: '1px solid var(--line-input)', fontSize: 12.5, fontWeight: 700 }}>Edit</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Every line was removed. Rescan or add an item by hand.</div>
        )}
        <div className="sub" style={{ marginTop: 12, lineHeight: 1.55, fontSize: 12.5 }}>Tap any row to fix the spelling, quantity or unit before adding.</div>
        {error && <div className="error">{error}</div>}
      </div>

      <div className="grow" />
      <div className="footer">
        <button className="btn" disabled={!items.length || busy} onClick={commit}>
          {busy ? 'Adding…' : `Add ${items.length} items to pantry`}
        </button>
        <div style={{ display: 'flex', gap: 10, marginTop: 11 }}>
          <button className="btn-outline" style={{ fontSize: 14, height: 46 }} onClick={() => nav('/pantry/add')}>Add a missed item</button>
          <button className="btn-outline" style={{ fontSize: 14, height: 46 }} onClick={() => nav('/scan')}>Scan another</button>
        </div>
      </div>

      {editIdx !== null && items[editIdx] && (
        <EditLineSheet
          line={items[editIdx]}
          scannedAt={scannedAt}
          onClose={() => setEditIdx(null)}
          onSave={(l) => {
            if (l) l = { ...l, confident: true };
            update(editIdx, l);
            setEditIdx(null);
          }}
        />
      )}
    </TabScreen>
  );
}

/** S4 — correct one OCR line. */
function EditLineSheet({ line, scannedAt, onClose, onSave }: { line: ScannedLine; scannedAt: string; onClose: () => void; onSave: (l: ScannedLine | null) => void }) {
  const [name, setName] = useState(line.name);
  const [qty, setQty] = useState(String(line.qty));
  const [unit, setUnit] = useState(line.unit);
  const valid = name.trim() && Number(qty) > 0;

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 className="h2" style={{ flex: 1 }}>Edit item</h2>
        <button className="link" style={{ textDecoration: 'none', color: 'var(--red)' }} onClick={() => onSave(null)}>Remove</button>
      </div>
      <div className="sub" style={{ marginTop: 5, lineHeight: 1.5 }}>Read from the receipt as “{line.raw}”. Correct anything that came out wrong.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 20 }}>
        <label className="field">
          <span className="label">Name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </label>
        <div className="field">
          <span className="label">Quantity</span>
          <div className="qty-row">
            <input className="input" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} aria-label="Quantity" />
            <UnitSelect value={unit} onChange={setUnit} units={UNITS} />
          </div>
        </div>
        <div className="field">
          <span className="label">Scanned</span>
          <div className="input readonly" style={{ display: 'flex', alignItems: 'center' }}>{fmtDateTime(scannedAt)} · not editable</div>
        </div>
      </div>
      <button className="btn" style={{ marginTop: 22 }} disabled={!valid} onClick={() => onSave({ ...line, name: name.trim(), qty: Number(qty), unit })}>
        Save changes
      </button>
      <button className="muted-link" onClick={onClose}>Cancel</button>
    </Sheet>
  );
}
