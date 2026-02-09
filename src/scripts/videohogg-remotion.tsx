import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AbsoluteFill, Html5Video, Sequence} from 'remotion';
import {Player} from '@remotion/player';

type IncomingClip = {
  id: string;
  name: string;
  url: string;
  note?: string;
  durationSeconds?: number | null;
  order?: number;
};

type EditorClip = IncomingClip & {
  sourceDurationSeconds: number;
  trimStart: number;
  trimEnd: number;
  include: boolean;
};

type ClipsChangedDetail = {
  clips?: IncomingClip[];
};

const FPS = 30;
const MIN_SEGMENT_SECONDS = 0.25;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const sanitizeDuration = (durationSeconds: number | null | undefined) => {
  if (!Number.isFinite(durationSeconds) || (durationSeconds ?? 0) <= 0.2) {
    return 6;
  }

  return Number(durationSeconds);
};

const toFrames = (seconds: number) => Math.max(1, Math.round(seconds * FPS));

type PreviewProps = {
  clips: Array<{
    id: string;
    name: string;
    note?: string;
    url: string;
    trimBefore: number;
    trimAfter: number;
    durationInFrames: number;
  }>;
};

const VideoHoggPreview: React.FC<PreviewProps> = ({clips}) => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#070f19'}}>
      {clips.map((clip) => {
        const from = cursor;
        cursor += clip.durationInFrames;

        return (
          <Sequence key={clip.id} from={from} durationInFrames={clip.durationInFrames} name={clip.name}>
            <AbsoluteFill>
              <Html5Video
                src={clip.url}
                trimBefore={clip.trimBefore}
                trimAfter={clip.trimAfter}
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#030712',
                }}
              />
              {clip.note ? (
                <AbsoluteFill
                  style={{
                    justifyContent: 'flex-end',
                    padding: '18px',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '70%',
                      background: 'rgba(15, 23, 42, 0.72)',
                      color: '#f8fafc',
                      borderRadius: 10,
                      padding: '8px 12px',
                      lineHeight: 1.45,
                      fontSize: 14,
                      letterSpacing: 0.2,
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                    }}
                  >
                    {clip.note}
                  </div>
                </AbsoluteFill>
              ) : null}
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const moveBy = <T,>(items: T[], index: number, delta: number): T[] => {
  const next = [...items];
  const destination = clamp(index + delta, 0, next.length - 1);
  if (destination === index) return next;

  const [item] = next.splice(index, 1);
  next.splice(destination, 0, item);
  return next;
};

const RemotionEditorShell: React.FC = () => {
  const [clips, setClips] = useState<EditorClip[]>([]);

  useEffect(() => {
    const handleChanged = (event: Event) => {
      const custom = event as CustomEvent<ClipsChangedDetail>;
      const incoming = Array.isArray(custom.detail?.clips) ? custom.detail?.clips : [];

      setClips((previous) => {
        const previousMap = new Map(previous.map((clip, index) => [clip.id, {clip, index}]));

        const merged = incoming
          .map((clip, incomingIndex) => {
            const existing = previousMap.get(clip.id)?.clip;
            const sourceDurationSeconds = sanitizeDuration(clip.durationSeconds);

            const trimStart = existing
              ? clamp(existing.trimStart, 0, Math.max(0, sourceDurationSeconds - MIN_SEGMENT_SECONDS))
              : 0;

            const trimEnd = existing
              ? clamp(existing.trimEnd, trimStart + MIN_SEGMENT_SECONDS, sourceDurationSeconds)
              : sourceDurationSeconds;

            return {
              id: clip.id,
              name: clip.name,
              url: clip.url,
              note: clip.note || '',
              durationSeconds: clip.durationSeconds,
              sourceDurationSeconds,
              trimStart,
              trimEnd,
              include: existing?.include ?? true,
              order: incomingIndex,
            } satisfies EditorClip;
          })
          .sort((a, b) => {
            const prevA = previousMap.get(a.id)?.index;
            const prevB = previousMap.get(b.id)?.index;

            if (typeof prevA === 'number' && typeof prevB === 'number') {
              return prevA - prevB;
            }

            if (typeof prevA === 'number') return -1;
            if (typeof prevB === 'number') return 1;
            return (a.order ?? 0) - (b.order ?? 0);
          });

        return merged;
      });
    };

    window.addEventListener('videohogg:clips-changed', handleChanged);
    window.dispatchEvent(new Event('videohogg:clips-request'));

    return () => window.removeEventListener('videohogg:clips-changed', handleChanged);
  }, []);

  useEffect(() => {
    const payload = clips.map((clip, index) => ({
      id: clip.id,
      include: clip.include,
      trim_start_seconds: Number(clip.trimStart.toFixed(3)),
      trim_end_seconds: Number(clip.trimEnd.toFixed(3)),
      order: index,
      source_duration_seconds: Number(clip.sourceDurationSeconds.toFixed(3)),
      name: clip.name,
    }));

    window.dispatchEvent(
      new CustomEvent('videohogg:remotion-edits-changed', {
        detail: {
          edits: payload,
        },
      }),
    );
  }, [clips]);

  const previewClips = useMemo(() => {
    return clips
      .filter((clip) => clip.include)
      .map((clip) => {
        const trimBefore = toFrames(clip.trimStart);
        const trimAfter = Math.max(trimBefore + 1, toFrames(clip.trimEnd));

        return {
          id: clip.id,
          name: clip.name,
          note: clip.note,
          url: clip.url,
          trimBefore,
          trimAfter,
          durationInFrames: Math.max(1, trimAfter - trimBefore),
        };
      });
  }, [clips]);

  const totalFrames = useMemo(() => {
    const sum = previewClips.reduce((acc, clip) => acc + clip.durationInFrames, 0);
    return Math.max(FPS * 2, sum);
  }, [previewClips]);

  const updateClip = (clipId: string, updater: (current: EditorClip) => EditorClip) => {
    setClips((previous) => previous.map((clip) => (clip.id === clipId ? updater(clip) : clip)));
  };

  if (clips.length === 0) {
    return <p className="vh-remotion-empty">Add clips above to unlock manual timeline editing.</p>;
  }

  return (
    <div className="vh-remotion-shell">
      <div className="vh-remotion-grid">
        <div className="vh-remotion-player-wrap">
          <Player
            component={VideoHoggPreview}
            durationInFrames={totalFrames}
            compositionWidth={1280}
            compositionHeight={720}
            fps={FPS}
            controls
            clickToPlay
            showVolumeControls={false}
            inputProps={{clips: previewClips}}
            style={{width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden'}}
          />
          <p className="vh-remotion-meta">
            {previewClips.length} included clip{previewClips.length === 1 ? '' : 's'} • {(totalFrames / FPS).toFixed(1)}s draft
          </p>
        </div>

        <div className="vh-remotion-controls" role="group" aria-label="Remotion clip controls">
          {clips.map((clip, index) => {
            const maxStart = Math.max(0, clip.trimEnd - MIN_SEGMENT_SECONDS);
            const minEnd = Math.min(clip.sourceDurationSeconds, clip.trimStart + MIN_SEGMENT_SECONDS);

            return (
              <article key={clip.id} className="vh-remotion-clip">
                <header className="vh-remotion-clip-head">
                  <div>
                    <p className="vh-remotion-clip-title">{clip.name}</p>
                    <p className="vh-remotion-clip-sub">Source {clip.sourceDurationSeconds.toFixed(2)}s</p>
                  </div>
                  <div className="vh-remotion-actions">
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      onClick={() => setClips((prev) => moveBy(prev, index, -1))}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      onClick={() => setClips((prev) => moveBy(prev, index, 1))}
                      disabled={index === clips.length - 1}
                    >
                      ↓
                    </button>
                    <label className="vh-remotion-toggle">
                      <input
                        type="checkbox"
                        checked={clip.include}
                        onChange={(event) =>
                          updateClip(clip.id, (current) => ({
                            ...current,
                            include: event.currentTarget.checked,
                          }))
                        }
                      />
                      Include
                    </label>
                  </div>
                </header>

                <label className="vh-remotion-field">
                  <span>Trim start: {clip.trimStart.toFixed(2)}s</span>
                  <input
                    type="range"
                    min={0}
                    max={maxStart}
                    step={0.05}
                    value={clip.trimStart}
                    onChange={(event) => {
                      const nextStart = Number(event.currentTarget.value);
                      updateClip(clip.id, (current) => ({
                        ...current,
                        trimStart: nextStart,
                        trimEnd: Math.max(nextStart + MIN_SEGMENT_SECONDS, current.trimEnd),
                      }));
                    }}
                  />
                </label>

                <label className="vh-remotion-field">
                  <span>Trim end: {clip.trimEnd.toFixed(2)}s</span>
                  <input
                    type="range"
                    min={minEnd}
                    max={clip.sourceDurationSeconds}
                    step={0.05}
                    value={clip.trimEnd}
                    onChange={(event) => {
                      const nextEnd = Number(event.currentTarget.value);
                      updateClip(clip.id, (current) => ({
                        ...current,
                        trimEnd: nextEnd,
                        trimStart: Math.min(current.trimStart, Math.max(0, nextEnd - MIN_SEGMENT_SECONDS)),
                      }));
                    }}
                  />
                </label>

                <p className="vh-remotion-clip-sub">
                  Segment length: {Math.max(0, clip.trimEnd - clip.trimStart).toFixed(2)}s
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const mountNode = document.getElementById('remotion-editor-root');

if (mountNode) {
  const root = createRoot(mountNode);
  root.render(<RemotionEditorShell />);
}
