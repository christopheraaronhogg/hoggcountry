import { schema, table, t } from 'spacetimedb/server';

const dadUpdate = table(
  { name: 'dad_update', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    title: t.string(),
    status: t.string(),
    latitude: t.f64(),
    longitude: t.f64(),
    detail: t.string(),
    observedAt: t.string()
  }
);

const videoDispatch = table(
  { name: 'video_dispatch', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    youtubeId: t.string(),
    title: t.string(),
    summary: t.string(),
    publishedAt: t.string()
  }
);

const publicAnnouncement = table(
  { name: 'public_announcement', public: true },
  {
    id: t.u64().primaryKey().autoInc(),
    title: t.string(),
    body: t.string(),
    publishedAt: t.string()
  }
);

const trailConditionReport = table(
  {
    name: 'trail_condition_report',
    public: true,
    indexes: [
      {
        accessor: 'trailId',
        name: 'trail_condition_report_trail_id_idx',
        algorithm: 'btree',
        columns: ['trailId']
      },
      {
        accessor: 'snappedMile',
        name: 'trail_condition_report_snapped_mile_idx',
        algorithm: 'btree',
        columns: ['snappedMile']
      }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    trailId: t.string(),
    source: t.string(),
    chipText: t.string().optional(),
    noteText: t.string(),
    reporterTrailName: t.string().optional(),
    snappedMile: t.f64(),
    observedAt: t.string(),
    status: t.string(),
    createdAt: t.string()
  }
);

const betaProfile = table(
  { name: 'beta_profile' },
  {
    id: t.u64().primaryKey().autoInc(),
    email: t.string(),
    name: t.string(),
    trailName: t.string(),
    createdAt: t.string()
  }
);

const manualNote = table(
  { name: 'manual_note' },
  {
    id: t.u64().primaryKey().autoInc(),
    trailName: t.string(),
    sectionId: t.string(),
    title: t.string(),
    body: t.string(),
    createdAt: t.string()
  }
);

const scoutWorkspaceAccess = table(
  {
    name: 'scout_workspace_access',
    indexes: [
      { accessor: 'identity', name: 'scout_workspace_access_identity_idx', algorithm: 'btree', columns: ['identity'] },
      { accessor: 'workspaceId', name: 'scout_workspace_access_workspace_id_idx', algorithm: 'btree', columns: ['workspaceId'] }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    identity: t.identity(),
    workspaceId: t.string(),
    createdAt: t.string()
  }
);

const scoutTurn = table(
  {
    name: 'scout_turn',
    indexes: [
      { accessor: 'workspaceId', name: 'scout_turn_workspace_id_idx', algorithm: 'btree', columns: ['workspaceId'] },
      { accessor: 'turnId', name: 'scout_turn_turn_id_idx', algorithm: 'btree', columns: ['turnId'] }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    workspaceId: t.string(),
    turnId: t.string(),
    status: t.string(),
    thinkingEffort: t.string(),
    startedAt: t.string(),
    updatedAt: t.string()
  }
);

const scoutTurnEvent = table(
  {
    name: 'scout_turn_event',
    indexes: [
      { accessor: 'workspaceId', name: 'scout_turn_event_workspace_id_idx', algorithm: 'btree', columns: ['workspaceId'] },
      { accessor: 'turnId', name: 'scout_turn_event_turn_id_idx', algorithm: 'btree', columns: ['turnId'] }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    workspaceId: t.string(),
    turnId: t.string(),
    eventSeq: t.u64(),
    kind: t.string(),
    payloadJson: t.string(),
    createdAt: t.string()
  }
);

const openclawDb = schema({
  dadUpdate,
  videoDispatch,
  publicAnnouncement,
  trailConditionReport,
  betaProfile,
  manualNote,
  scoutWorkspaceAccess,
  scoutTurn,
  scoutTurnEvent
});

export const myScoutTurns = openclawDb.view({ name: 'my_scout_turns', public: true }, t.array(scoutTurn.rowType), (ctx) => {
  return ctx.from.scoutTurn
    .leftSemijoin(ctx.from.scoutWorkspaceAccess.where((access) => access.identity.eq(ctx.sender)), (turn, access) =>
      turn.workspaceId.eq(access.workspaceId)
    )
    .build();
});

export const myScoutTurnEvents = openclawDb.view(
  { name: 'my_scout_turn_events', public: true },
  t.array(scoutTurnEvent.rowType),
  (ctx) => {
    return ctx.from.scoutTurnEvent
      .leftSemijoin(ctx.from.scoutWorkspaceAccess.where((access) => access.identity.eq(ctx.sender)), (event, access) =>
        event.workspaceId.eq(access.workspaceId)
      )
      .build();
  }
);

export default openclawDb;

export const init = openclawDb.init((ctx) => {
  if (ctx.db.publicAnnouncement.count() === 0) {
    ctx.db.publicAnnouncement.insert({
      id: 0n,
      title: 'Manual-first hiking',
      body: 'The hiker workspace is built to turn trail documents, judgment, and personal notes into one durable field manual.',
      publishedAt: new Date().toISOString()
    });
  }
});

function hasScoutWorkspaceAccess(ctx: { db: any; sender: unknown }, workspaceId: string): boolean {
  for (const access of ctx.db.scoutWorkspaceAccess.identity.filter(ctx.sender)) {
    if (access.workspaceId === workspaceId) return true;
  }

  return false;
}

export const registerBetaProfile = openclawDb.reducer(
  {
    email: t.string(),
    name: t.string(),
    trailName: t.string()
  },
  (ctx, payload) => {
    ctx.db.betaProfile.insert({
      id: 0n,
      email: payload.email,
      name: payload.name,
      trailName: payload.trailName,
      createdAt: new Date().toISOString()
    });
  }
);

export const appendManualNote = openclawDb.reducer(
  {
    trailName: t.string(),
    sectionId: t.string(),
    title: t.string(),
    body: t.string()
  },
  (ctx, payload) => {
    ctx.db.manualNote.insert({
      id: 0n,
      trailName: payload.trailName,
      sectionId: payload.sectionId,
      title: payload.title,
      body: payload.body,
      createdAt: new Date().toISOString()
    });
  }
);

export const submitTrailConditionReport = openclawDb.reducer(
  {
    trailId: t.string(),
    source: t.string(),
    chipText: t.string().optional(),
    noteText: t.string(),
    reporterTrailName: t.string().optional(),
    snappedMile: t.f64(),
    observedAt: t.string().optional()
  },
  (ctx, payload) => {
    const trailId = payload.trailId.trim() || 'appalachian-trail';
    const chipText = payload.chipText?.trim() || undefined;
    const noteText = (payload.noteText.trim() || chipText || '').trim();
    if (!noteText) return;

    const snappedMile = Math.round(payload.snappedMile * 10) / 10;
    if (!Number.isFinite(snappedMile) || snappedMile < 0) return;

    const observedAt = payload.observedAt?.trim() || new Date().toISOString();

    ctx.db.trailConditionReport.insert({
      id: 0n,
      trailId,
      source: payload.source.trim() || 'chip',
      chipText,
      noteText,
      reporterTrailName: payload.reporterTrailName?.trim() || undefined,
      snappedMile,
      observedAt,
      status: 'active',
      createdAt: new Date().toISOString()
    });
  }
);

export const joinScoutWorkspace = openclawDb.reducer(
  {
    workspaceId: t.string()
  },
  (ctx, payload) => {
    const workspaceId = payload.workspaceId.trim();
    if (!workspaceId) return;

    if (hasScoutWorkspaceAccess(ctx, workspaceId)) return;

    ctx.db.scoutWorkspaceAccess.insert({
      id: 0n,
      identity: ctx.sender,
      workspaceId,
      createdAt: new Date().toISOString()
    });
  }
);

export const mirrorScoutTurn = openclawDb.reducer(
  {
    workspaceId: t.string(),
    turnId: t.string(),
    status: t.string(),
    thinkingEffort: t.string()
  },
  (ctx, payload) => {
    const now = new Date().toISOString();
    const workspaceId = payload.workspaceId.trim();
    const turnId = payload.turnId.trim();
    if (!workspaceId || !turnId) return;

    if (!hasScoutWorkspaceAccess(ctx, workspaceId)) return;

    for (const existing of ctx.db.scoutTurn.turnId.filter(turnId)) {
      if (existing.workspaceId !== workspaceId) continue;
      ctx.db.scoutTurn.id.update({
        ...existing,
        status: payload.status,
        thinkingEffort: payload.thinkingEffort,
        updatedAt: now
      });
      return;
    }

    ctx.db.scoutTurn.insert({
      id: 0n,
      workspaceId,
      turnId,
      status: payload.status,
      thinkingEffort: payload.thinkingEffort,
      startedAt: now,
      updatedAt: now
    });
  }
);

export const mirrorScoutTurnEvent = openclawDb.reducer(
  {
    workspaceId: t.string(),
    turnId: t.string(),
    eventSeq: t.u64(),
    kind: t.string(),
    payloadJson: t.string()
  },
  (ctx, payload) => {
    const workspaceId = payload.workspaceId.trim();
    const turnId = payload.turnId.trim();
    if (!workspaceId || !turnId || !hasScoutWorkspaceAccess(ctx, workspaceId)) return;

    ctx.db.scoutTurnEvent.insert({
      id: 0n,
      workspaceId,
      turnId,
      eventSeq: payload.eventSeq,
      kind: payload.kind,
      payloadJson: payload.payloadJson,
      createdAt: new Date().toISOString()
    });
  }
);
