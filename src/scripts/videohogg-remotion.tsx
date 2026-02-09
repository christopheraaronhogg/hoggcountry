import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AbsoluteFill, Html5Video, Sequence} from 'remotion';
import {Player, type PlayerRef} from '@remotion/player';

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

type TimelineSegment = {
  clip: EditorClip;
  startFrame: number;
  durationFrames: number;
};

type TrimDragState = {
  clipId: string;
  side: 'start' | 'end';
  startClientX: number;
  initialStart: number;
  initialEnd: number;
  sourceDuration: number;
};

const FPS = 30;
const MIN_SEGMENT_SECONDS = 0.25;
const TIMELINE_PX_PER_SECOND = 56;

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

const moveBy = <T,>(items: T[], index: number, delta: number): T[] => {
  const next = [...items];
  const destination = clamp(index + delta, 0, next.length - 1);
  if (destination === index) return next;

  const [item] = next.splice(index, 1);
  next.splice(destination, 0, item);
  return next;
};

const reorderById = (
  list: EditorClip[],
  sourceId: string,
  targetId: string,
  insertBefore: boolean,
): EditorClip[] => {
  if (!sourceId || !targetId || sourceId === targetId) return list;

  const sourceIndex = list.findIndex((clip) => clip.id === sourceId);
  const targetIndex = list.findIndex((clip) => clip.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) return list;

  const next = [...list];
  const [moved] = next.splice(sourceIndex, 1);

  let destination = targetIndex;
  if (sourceIndex < targetIndex) {
    destination -= 1;
  }
  if (!insertBefore) {
    destination += 1;
  }

  destination = clamp(destination, 0, next.length);
  next.splice(destination, 0, moved);

  return next;
};

const RemotionEditorShell: React.FC = () => {
  const [clips, setClips] = useState<EditorClip[]>([]);
  const [playerHandle, setPlayerHandle] = useState<PlayerRef | null>(null);
  const [playerFrame, setPlayerFrame] = useState(0);
  const [draggingSegmentId, setDraggingSegmentId] = useState<string | null>(null);
  const [dropHint, setDropHint] = useState<{targetId: string; before: boolean} | null>(null);
  const [trimDrag, setTrimDrag] = useState<TrimDragState | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

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

  const includedClips = useMemo(() => clips.filter((clip) => clip.include), [clips]);
  const excludedClips = useMemo(() => clips.filter((clip) => !clip.include), [clips]);

  useEffect(() => {
    if (clips.length === 0) {
      setSelectedClipId(null);
      return;
    }

    setSelectedClipId((previous) => {
      if (previous && clips.some((clip) => clip.id === previous)) {
        return previous;
      }

      return clips.find((clip) => clip.include)?.id ?? clips[0]?.id ?? null;
    });
  }, [clips]);

  const timelineSegments = useMemo<TimelineSegment[]>(() => {
    const previewById = new Map(previewClips.map((clip) => [clip.id, clip]));
    let cursorFrames = 0;

    return includedClips.map((clip) => {
      const preview = previewById.get(clip.id);
      const durationFrames = preview?.durationInFrames ?? Math.max(1, toFrames(clip.trimEnd - clip.trimStart));
      const segment = {
        clip,
        startFrame: cursorFrames,
        durationFrames,
      } satisfies TimelineSegment;

      cursorFrames += durationFrames;
      return segment;
    });
  }, [includedClips, previewClips]);

  const timelineFrames = useMemo(() => {
    const sum = timelineSegments.reduce((acc, segment) => acc + segment.durationFrames, 0);
    return Math.max(1, sum);
  }, [timelineSegments]);

  const timelineWidthPx = useMemo(() => {
    const seconds = timelineFrames / FPS;
    return Math.max(680, Math.round(seconds * TIMELINE_PX_PER_SECOND));
  }, [timelineFrames]);

  const maxFrame = Math.max(0, totalFrames - 1);

  const includedCount = includedClips.length;
  const excludedCount = excludedClips.length;
  const trimmedCount = clips.filter((clip) => clip.trimStart > 0 || clip.trimEnd < clip.sourceDurationSeconds).length;
  const selectedClip = clips.find((clip) => clip.id === selectedClipId) ?? null;
  const selectedClipIndex = selectedClip ? clips.findIndex((clip) => clip.id === selectedClip.id) : -1;
  const selectedClipIsTrimmed = selectedClip
    ? selectedClip.trimStart > 0 || selectedClip.trimEnd < selectedClip.sourceDurationSeconds
    : false;

  const updateClip = useCallback((clipId: string, updater: (current: EditorClip) => EditorClip) => {
    setClips((previous) => previous.map((clip) => (clip.id === clipId ? updater(clip) : clip)));
  }, []);

  const seekToFrame = useCallback(
    (frame: number) => {
      const bounded = clamp(Math.round(frame), 0, maxFrame);
      setPlayerFrame(bounded);
      playerHandle?.seekTo(bounded);
    },
    [maxFrame, playerHandle],
  );

  useEffect(() => {
    if (!playerHandle) return;

    const onFrameUpdate = (event: {detail: {frame: number}}) => {
      setPlayerFrame(event.detail.frame);
    };

    playerHandle.addEventListener('frameupdate', onFrameUpdate);
    setPlayerFrame(playerHandle.getCurrentFrame());

    return () => {
      playerHandle.removeEventListener('frameupdate', onFrameUpdate);
    };
  }, [playerHandle]);

  useEffect(() => {
    if (playerFrame > maxFrame) {
      seekToFrame(maxFrame);
    }
  }, [maxFrame, playerFrame, seekToFrame]);

  const seekFromPointer = useCallback(
    (clientX: number) => {
      const scroller = timelineScrollRef.current;
      if (!scroller) return;

      const rect = scroller.getBoundingClientRect();
      const x = clamp(clientX - rect.left + scroller.scrollLeft, 0, timelineWidthPx);
      const ratio = timelineWidthPx > 0 ? x / timelineWidthPx : 0;
      seekToFrame(ratio * maxFrame);
    },
    [maxFrame, seekToFrame, timelineWidthPx],
  );

  useEffect(() => {
    if (!isScrubbing) return;

    const onMove = (event: PointerEvent) => {
      seekFromPointer(event.clientX);
    };

    const onUp = () => {
      setIsScrubbing(false);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, {once: true});

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [isScrubbing, seekFromPointer]);

  useEffect(() => {
    if (!trimDrag) return;

    const onMove = (event: PointerEvent) => {
      const deltaSec = (event.clientX - trimDrag.startClientX) / TIMELINE_PX_PER_SECOND;

      setClips((previous) =>
        previous.map((clip) => {
          if (clip.id !== trimDrag.clipId) return clip;

          if (trimDrag.side === 'start') {
            const nextStart = clamp(
              trimDrag.initialStart + deltaSec,
              0,
              Math.max(0, trimDrag.initialEnd - MIN_SEGMENT_SECONDS),
            );

            return {
              ...clip,
              trimStart: nextStart,
              trimEnd: Math.max(nextStart + MIN_SEGMENT_SECONDS, clip.trimEnd),
            };
          }

          const nextEnd = clamp(
            trimDrag.initialEnd + deltaSec,
            trimDrag.initialStart + MIN_SEGMENT_SECONDS,
            trimDrag.sourceDuration,
          );

          return {
            ...clip,
            trimEnd: nextEnd,
            trimStart: Math.min(clip.trimStart, Math.max(0, nextEnd - MIN_SEGMENT_SECONDS)),
          };
        }),
      );
    };

    const onUp = () => {
      setTrimDrag(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, {once: true});

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [trimDrag]);

  const beginTrimDrag = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, clip: EditorClip, side: 'start' | 'end') => {
      event.preventDefault();
      event.stopPropagation();

      if (!clip.include) return;

      setTrimDrag({
        clipId: clip.id,
        side,
        startClientX: event.clientX,
        initialStart: clip.trimStart,
        initialEnd: clip.trimEnd,
        sourceDuration: clip.sourceDurationSeconds,
      });
    },
    [],
  );

  const playheadLeftPx = maxFrame > 0 ? (clamp(playerFrame, 0, maxFrame) / maxFrame) * timelineWidthPx : 0;

  const timelineTickFrames = useMemo(() => {
    const seconds = timelineFrames / FPS;
    const tickSeconds = seconds > 180 ? 20 : seconds > 120 ? 15 : seconds > 60 ? 10 : 5;
    const stepFrames = Math.max(1, Math.round(tickSeconds * FPS));

    const ticks: number[] = [];
    for (let frame = 0; frame <= timelineFrames; frame += stepFrames) {
      ticks.push(frame);
    }

    if (ticks[ticks.length - 1] !== timelineFrames) {
      ticks.push(timelineFrames);
    }

    return ticks;
  }, [timelineFrames]);

  if (clips.length === 0) {
    return <p className="vh-remotion-empty">Add clips above to unlock manual timeline editing.</p>;
  }

  const totalSeconds = totalFrames / FPS;
  const selectedMaxStart = selectedClip
    ? Math.max(0, selectedClip.trimEnd - MIN_SEGMENT_SECONDS)
    : 0;
  const selectedMinEnd = selectedClip
    ? Math.min(selectedClip.sourceDurationSeconds, selectedClip.trimStart + MIN_SEGMENT_SECONDS)
    : MIN_SEGMENT_SECONDS;
  const selectedSegmentSeconds = selectedClip
    ? Math.max(0, selectedClip.trimEnd - selectedClip.trimStart)
    : 0;

  return (
    <div className="vh-remotion-shell">
      <div className="vh-remotion-grid">
        <div className="vh-remotion-player-wrap">
          <Player
            ref={(instance) => setPlayerHandle(instance)}
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

          <div className="vh-remotion-status-bar">
            <p className="vh-remotion-meta">
              <strong>{includedCount}/{clips.length}</strong> clips
              {excludedCount > 0 && <span className="vh-remotion-meta-dim"> · {excludedCount} excluded</span>}
              {trimmedCount > 0 && <span className="vh-remotion-meta-dim"> · {trimmedCount} trimmed</span>}
              {' · '}
              <strong>{formatTime(totalSeconds)}</strong>
            </p>
          </div>

          <section className="vh-remotion-timeline-shell" aria-label="Timeline editor">
            <div className="vh-remotion-ruler">
              <div className="vh-remotion-ruler-ticks" style={{width: `${timelineWidthPx}px`}}>
                {timelineTickFrames.map((frame) => {
                  const left = timelineFrames > 0 ? (frame / timelineFrames) * timelineWidthPx : 0;

                  return (
                    <div key={frame} className="vh-remotion-ruler-tick" style={{left: `${left}px`}}>
                      <span>{formatTime(frame / FPS)}</span>
                    </div>
                  );
                })}
              </div>

              <input
                className="vh-remotion-scrub"
                type="range"
                min={0}
                max={maxFrame}
                step={1}
                value={clamp(playerFrame, 0, maxFrame)}
                onChange={(event) => seekToFrame(Number(event.currentTarget.value))}
                aria-label="Scrub timeline"
              />
            </div>

            <div
              ref={timelineScrollRef}
              className="vh-remotion-track-scroll"
              onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.closest('[data-segment-id]')) return;
                seekFromPointer(event.clientX);
              }}
            >
              <div className="vh-remotion-track" style={{width: `${timelineWidthPx}px`}}>
                <div
                  className={`vh-remotion-playhead ${isScrubbing ? 'is-scrubbing' : ''}`}
                  style={{left: `${playheadLeftPx}px`}}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setIsScrubbing(true);
                    seekFromPointer(event.clientX);
                  }}
                >
                  <span className="vh-remotion-playhead-cap" />
                </div>

                {timelineSegments.map((segment) => {
                  const left = timelineFrames > 0 ? (segment.startFrame / timelineFrames) * timelineWidthPx : 0;
                  const width = timelineFrames > 0
                    ? (segment.durationFrames / timelineFrames) * timelineWidthPx
                    : timelineWidthPx;

                  const dropBefore = dropHint?.targetId === segment.clip.id && dropHint.before;
                  const dropAfter = dropHint?.targetId === segment.clip.id && !dropHint.before;

                  return (
                    <article
                      key={segment.clip.id}
                      data-segment-id={segment.clip.id}
                      className={`vh-remotion-segment ${draggingSegmentId === segment.clip.id ? 'is-dragging' : ''} ${dropBefore ? 'is-drop-before' : ''} ${dropAfter ? 'is-drop-after' : ''} ${selectedClipId === segment.clip.id ? 'is-selected' : ''}`}
                      style={{left: `${left}px`, width: `${width}px`}}
                      draggable
                      onClick={() => {
                        setSelectedClipId(segment.clip.id);
                        seekToFrame(segment.startFrame);
                      }}
                      onDragStart={(event) => {
                        setDraggingSegmentId(segment.clip.id);
                        setSelectedClipId(segment.clip.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', segment.clip.id);
                      }}
                      onDragOver={(event) => {
                        if (!draggingSegmentId || draggingSegmentId === segment.clip.id) return;

                        event.preventDefault();
                        const rect = event.currentTarget.getBoundingClientRect();
                        const before = event.clientX < rect.left + rect.width / 2;
                        setDropHint({targetId: segment.clip.id, before});
                      }}
                      onDrop={(event) => {
                        event.preventDefault();

                        if (!draggingSegmentId || draggingSegmentId === segment.clip.id) {
                          setDropHint(null);
                          return;
                        }

                        const rect = event.currentTarget.getBoundingClientRect();
                        const before = event.clientX < rect.left + rect.width / 2;

                        setClips((previous) => reorderById(previous, draggingSegmentId, segment.clip.id, before));
                        setDropHint(null);
                        setDraggingSegmentId(null);
                      }}
                      onDragEnd={() => {
                        setDropHint(null);
                        setDraggingSegmentId(null);
                      }}
                    >
                      <button
                        type="button"
                        className="vh-remotion-trim-handle vh-remotion-trim-handle--start"
                        title="Drag to trim start"
                        aria-label={`Trim start for ${segment.clip.name}`}
                        onPointerDown={(event) => beginTrimDrag(event, segment.clip, 'start')}
                      >
                        ⋮
                      </button>

                      <div className="vh-remotion-segment-body">
                        <p className="vh-remotion-segment-title">{segment.clip.name}</p>
                        <p className="vh-remotion-segment-meta">
                          {formatTime(Math.max(0, segment.clip.trimEnd - segment.clip.trimStart))}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="vh-remotion-trim-handle vh-remotion-trim-handle--end"
                        title="Drag to trim end"
                        aria-label={`Trim end for ${segment.clip.name}`}
                        onPointerDown={(event) => beginTrimDrag(event, segment.clip, 'end')}
                      >
                        ⋮
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="vh-remotion-mobile-clip-nav" role="tablist" aria-label="Clip picker">
              {clips.map((clip, index) => {
                const isSelected = selectedClipId === clip.id;

                return (
                  <button
                    key={clip.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`vh-remotion-mobile-clip-pill ${isSelected ? 'is-selected' : ''} ${clip.include ? '' : 'is-excluded'}`}
                    onClick={() => {
                      setSelectedClipId(clip.id);

                      const segment = timelineSegments.find((entry) => entry.clip.id === clip.id);
                      if (segment) {
                        seekToFrame(segment.startFrame);
                      }
                    }}
                  >
                    <span className="vh-remotion-mobile-clip-pill-num">{index + 1}</span>
                    <span className="vh-remotion-mobile-clip-pill-name">{clip.name}</span>
                    {!clip.include && <span className="vh-remotion-mobile-clip-pill-flag">Skipped</span>}
                  </button>
                );
              })}
            </div>

            {selectedClip && (
              <section className="vh-remotion-mobile-inspector" aria-label="Selected clip quick edit">
                <header className="vh-remotion-mobile-head">
                  <div>
                    <p className="vh-remotion-mobile-kicker">Selected clip</p>
                    <p className="vh-remotion-mobile-title">{selectedClip.name}</p>
                    <p className="vh-remotion-mobile-sub">
                      {formatTime(selectedClip.sourceDurationSeconds)} total
                      {selectedClip.include ? ` · ${formatTime(selectedSegmentSeconds)} used` : ' · currently excluded'}
                    </p>
                  </div>
                  <div className="vh-remotion-mobile-reorder">
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      title="Move clip left"
                      aria-label="Move selected clip left"
                      disabled={selectedClipIndex <= 0}
                      onClick={() => {
                        if (selectedClipIndex < 0) return;
                        setClips((previous) => moveBy(previous, selectedClipIndex, -1));
                      }}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      title="Move clip right"
                      aria-label="Move selected clip right"
                      disabled={selectedClipIndex < 0 || selectedClipIndex >= clips.length - 1}
                      onClick={() => {
                        if (selectedClipIndex < 0) return;
                        setClips((previous) => moveBy(previous, selectedClipIndex, 1));
                      }}
                    >
                      →
                    </button>
                  </div>
                </header>

                <label className={`vh-remotion-field ${!selectedClip.include ? 'vh-remotion-field--disabled' : ''}`}>
                  <span>
                    Start
                    <span className="vh-remotion-time">{selectedClip.trimStart.toFixed(1)}s</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={selectedMaxStart}
                    step={0.05}
                    value={selectedClip.trimStart}
                    disabled={!selectedClip.include}
                    onChange={(event) => {
                      const nextStart = Number(event.currentTarget.value);
                      updateClip(selectedClip.id, (current) => ({
                        ...current,
                        trimStart: nextStart,
                        trimEnd: Math.max(nextStart + MIN_SEGMENT_SECONDS, current.trimEnd),
                      }));
                    }}
                  />
                </label>

                <label className={`vh-remotion-field ${!selectedClip.include ? 'vh-remotion-field--disabled' : ''}`}>
                  <span>
                    End
                    <span className="vh-remotion-time">{selectedClip.trimEnd.toFixed(1)}s</span>
                  </span>
                  <input
                    type="range"
                    min={selectedMinEnd}
                    max={selectedClip.sourceDurationSeconds}
                    step={0.05}
                    value={selectedClip.trimEnd}
                    disabled={!selectedClip.include}
                    onChange={(event) => {
                      const nextEnd = Number(event.currentTarget.value);
                      updateClip(selectedClip.id, (current) => ({
                        ...current,
                        trimEnd: nextEnd,
                        trimStart: Math.min(current.trimStart, Math.max(0, nextEnd - MIN_SEGMENT_SECONDS)),
                      }));
                    }}
                  />
                </label>

                <footer className="vh-remotion-mobile-actions">
                  <button
                    type="button"
                    className={`vh-remotion-include-btn ${selectedClip.include ? 'vh-remotion-include-btn--active' : 'vh-remotion-include-btn--inactive'}`}
                    onClick={() =>
                      updateClip(selectedClip.id, (current) => ({
                        ...current,
                        include: !current.include,
                      }))
                    }
                  >
                    {selectedClip.include ? '✓ Included' : '○ Excluded'}
                  </button>

                  {selectedClipIsTrimmed && selectedClip.include && (
                    <button
                      type="button"
                      className="vh-remotion-reset-btn"
                      onClick={() =>
                        updateClip(selectedClip.id, (current) => ({
                          ...current,
                          trimStart: 0,
                          trimEnd: current.sourceDurationSeconds,
                        }))
                      }
                    >
                      Reset trim
                    </button>
                  )}
                </footer>
              </section>
            )}

            {excludedClips.length > 0 && (
              <div className="vh-remotion-excluded-rack">
                <p className="vh-remotion-excluded-label">Excluded clips (click to add back):</p>
                <div className="vh-remotion-excluded-list">
                  {excludedClips.map((clip) => (
                    <button
                      key={clip.id}
                      type="button"
                      className="vh-remotion-excluded-chip"
                      onClick={() => {
                        setSelectedClipId(clip.id);
                        updateClip(clip.id, (current) => ({...current, include: true}));
                      }}
                    >
                      + {clip.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        <div className="vh-remotion-controls" role="group" aria-label="Remotion clip controls">
          {clips.map((clip, index) => {
            const maxStart = Math.max(0, clip.trimEnd - MIN_SEGMENT_SECONDS);
            const minEnd = Math.min(clip.sourceDurationSeconds, clip.trimStart + MIN_SEGMENT_SECONDS);
            const segmentLength = Math.max(0, clip.trimEnd - clip.trimStart);
            const isTrimmed = clip.trimStart > 0 || clip.trimEnd < clip.sourceDurationSeconds;

            return (
              <article
                key={clip.id}
                className={`vh-remotion-clip ${clip.include ? 'vh-remotion-clip--included' : 'vh-remotion-clip--excluded'} ${selectedClipId === clip.id ? 'vh-remotion-clip--active' : ''}`}
                onClick={() => setSelectedClipId(clip.id)}
              >
                <header className="vh-remotion-clip-head">
                  <div className="vh-remotion-clip-info">
                    <div className="vh-remotion-clip-title-row">
                      <span className={`vh-remotion-clip-num ${!clip.include ? 'vh-remotion-clip-num--excluded' : ''}`}>{index + 1}</span>
                      <p className={`vh-remotion-clip-title ${!clip.include ? 'vh-remotion-clip-title--excluded' : ''}`}>{clip.name}</p>
                      {!clip.include && <span className="vh-remotion-status-badge vh-remotion-status-badge--excluded">Skipped</span>}
                    </div>
                    <p className="vh-remotion-clip-sub">
                      {formatTime(clip.sourceDurationSeconds)} total
                      {isTrimmed && clip.include && (
                        <span className="vh-remotion-clip-sub--trimmed"> → {formatTime(segmentLength)} used</span>
                      )}
                    </p>
                  </div>
                  <div className="vh-remotion-actions">
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      title="Move up"
                      aria-label="Move clip up"
                      onClick={() => setClips((prev) => moveBy(prev, index, -1))}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="vh-remotion-btn"
                      title="Move down"
                      aria-label="Move clip down"
                      onClick={() => setClips((prev) => moveBy(prev, index, 1))}
                      disabled={index === clips.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                </header>

                <div className="vh-remotion-clip-body">
                  <label className={`vh-remotion-field ${!clip.include ? 'vh-remotion-field--disabled' : ''}`}>
                    <span>
                      Start
                      <span className="vh-remotion-time">{clip.trimStart.toFixed(1)}s</span>
                      {clip.trimStart > 0 && <span className="vh-remotion-badge vh-remotion-badge--trim">Trimmed</span>}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={maxStart}
                      step={0.05}
                      value={clip.trimStart}
                      disabled={!clip.include}
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

                  <label className={`vh-remotion-field ${!clip.include ? 'vh-remotion-field--disabled' : ''}`}>
                    <span>
                      End
                      <span className="vh-remotion-time">{clip.trimEnd.toFixed(1)}s</span>
                      {clip.trimEnd < clip.sourceDurationSeconds && (
                        <span className="vh-remotion-badge vh-remotion-badge--trim">Trimmed</span>
                      )}
                    </span>
                    <input
                      type="range"
                      min={minEnd}
                      max={clip.sourceDurationSeconds}
                      step={0.05}
                      value={clip.trimEnd}
                      disabled={!clip.include}
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
                </div>

                <footer className="vh-remotion-clip-footer">
                  <button
                    type="button"
                    className={`vh-remotion-include-btn ${clip.include ? 'vh-remotion-include-btn--active' : 'vh-remotion-include-btn--inactive'}`}
                    onClick={() =>
                      updateClip(clip.id, (current) => ({
                        ...current,
                        include: !current.include,
                      }))
                    }
                  >
                    {clip.include ? '✓ Included' : '○ Excluded'}
                  </button>
                  {isTrimmed && clip.include && (
                    <button
                      type="button"
                      className="vh-remotion-reset-btn"
                      onClick={() =>
                        updateClip(clip.id, (current) => ({
                          ...current,
                          trimStart: 0,
                          trimEnd: current.sourceDurationSeconds,
                        }))
                      }
                    >
                      Reset
                    </button>
                  )}
                </footer>
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
