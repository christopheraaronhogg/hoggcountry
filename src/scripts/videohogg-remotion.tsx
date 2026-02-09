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

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

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

const RemotionEditorShell: React.FC = () => {
  const [clips, setClips] = useState<EditorClip[]>([]);

  useEffect(() => {
    const handleChanged = (event: Event) => {
      const custom = event as CustomEvent<ClipsChangedDetail>;
      const incoming = Array.isArray(custom.detail?.clips) ? custom.detail?.clips : [];

      setClips((previous) => {
        const previousMap = new Map(previous.map((clip, index) => [clip.id, {clip, index}]));

        return incoming
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

  const includedCount = clips.filter((clip) => clip.include).length;
  const excludedCount = clips.length - includedCount;
  const trimmedCount = clips.filter((clip) => clip.trimStart > 0 || clip.trimEnd < clip.sourceDurationSeconds).length;

  if (clips.length === 0) {
    return <p className="vh-remotion-empty">Add clips above to preview the full Remotion player.</p>;
  }

  const totalSeconds = totalFrames / FPS;

  return (
    <div className="vh-remotion-shell">
      <div className="vh-remotion-player-wrap vh-remotion-player-wrap--full">
        <Player
          component={VideoHoggPreview}
          durationInFrames={totalFrames}
          compositionWidth={1280}
          compositionHeight={720}
          fps={FPS}
          controls
          clickToPlay
          allowFullscreen
          doubleClickToFullscreen
          spaceKeyToPlayOrPause
          showVolumeControls
          showPlaybackRateControl
          inputProps={{clips: previewClips}}
          style={{width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden'}}
        />

        <div className="vh-remotion-status-bar">
          <p className="vh-remotion-meta">
            <strong>Full player mode</strong>
            {' · '}
            <strong>{includedCount}/{clips.length}</strong> clips
            {excludedCount > 0 && <span className="vh-remotion-meta-dim"> · {excludedCount} excluded</span>}
            {trimmedCount > 0 && <span className="vh-remotion-meta-dim"> · {trimmedCount} trimmed</span>}
            {' · '}
            <strong>{formatTime(totalSeconds)}</strong>
          </p>
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
