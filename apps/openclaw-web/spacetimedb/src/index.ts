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

// Crowdsourced water-source status (flowing / low / dry), keyed to a source's
// mile so it's shared across the tramily. The client buckets by 0.1 mi and shows
// latest-wins per source.
const waterReport = table(
  {
    name: 'water_report',
    public: true,
    indexes: [
      {
        accessor: 'trailId',
        name: 'water_report_trail_id_idx',
        algorithm: 'btree',
        columns: ['trailId']
      },
      {
        accessor: 'mile',
        name: 'water_report_mile_idx',
        algorithm: 'btree',
        columns: ['mile']
      }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    trailId: t.string(),
    mile: t.f64(),
    sourceName: t.string(),
    status: t.string(),
    reporterTrailName: t.string().optional(),
    observedAt: t.string(),
    createdAt: t.string()
  }
);

// --- Live tramily/family location sharing (Life360-style, but PRIVATE) --------
// group_member and group_position are NOT public: they can never be subscribed
// directly. Membership and positions are only ever read through the public,
// sender-scoped views below (my_group_members / my_group_positions), which
// semijoin against the caller's OWN membership — so a client only ever receives
// rows for groups it actually belongs to. The group_code is the bearer secret
// (high-entropy, shared out-of-band); knowing it is what grants a client into a
// group, exactly like a Life360 invite link.
const groupMember = table(
  {
    name: 'group_member',
    indexes: [
      { accessor: 'identity', name: 'group_member_identity_idx', algorithm: 'btree', columns: ['identity'] },
      { accessor: 'groupCode', name: 'group_member_group_code_idx', algorithm: 'btree', columns: ['groupCode'] }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    groupCode: t.string(),
    identity: t.identity(),
    trailName: t.string(),
    joinedAt: t.string()
  }
);

const groupPosition = table(
  {
    name: 'group_position',
    indexes: [
      { accessor: 'identity', name: 'group_position_identity_idx', algorithm: 'btree', columns: ['identity'] },
      { accessor: 'groupCode', name: 'group_position_group_code_idx', algorithm: 'btree', columns: ['groupCode'] }
    ]
  },
  {
    id: t.u64().primaryKey().autoInc(),
    groupCode: t.string(),
    identity: t.identity(),
    trailName: t.string(),
    mile: t.f64(),
    observedAt: t.string(),
    updatedAt: t.string()
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

const scoutDb = schema({
  dadUpdate,
  videoDispatch,
  publicAnnouncement,
  trailConditionReport,
  waterReport,
  groupMember,
  groupPosition,
  betaProfile,
  manualNote,
  scoutWorkspaceAccess,
  scoutTurn,
  scoutTurnEvent
});

export const myScoutTurns = scoutDb.view({ name: 'my_scout_turns', public: true }, t.array(scoutTurn.rowType), (ctx) => {
  return ctx.from.scoutTurn
    .leftSemijoin(ctx.from.scoutWorkspaceAccess.where((access) => access.identity.eq(ctx.sender)), (turn, access) =>
      turn.workspaceId.eq(access.workspaceId)
    )
    .build();
});

export const myScoutTurnEvents = scoutDb.view(
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

// A client only ever sees positions for groups it belongs to: semijoin each
// group_position against the CALLER's own membership rows on group_code. A
// non-member's membership set never contains the code, so the row is filtered
// out server-side before it ever reaches them.
export const myGroupPositions = scoutDb.view(
  { name: 'my_group_positions', public: true },
  t.array(groupPosition.rowType),
  (ctx) => {
    return ctx.from.groupPosition
      .leftSemijoin(
        ctx.from.groupMember.where((member) => member.identity.eq(ctx.sender)),
        (position, mine) => position.groupCode.eq(mine.groupCode)
      )
      .build();
  }
);

// The roster the caller is allowed to see: every member of any group the caller
// is in (so the UI can show "in this shared group" / who's invited), scoped the
// same way.
export const myGroupMembers = scoutDb.view(
  { name: 'my_group_members', public: true },
  t.array(groupMember.rowType),
  (ctx) => {
    return ctx.from.groupMember
      .leftSemijoin(
        ctx.from.groupMember.where((member) => member.identity.eq(ctx.sender)),
        (other, mine) => other.groupCode.eq(mine.groupCode)
      )
      .build();
  }
);

export default scoutDb;

export const init = scoutDb.init((ctx) => {
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

export const registerBetaProfile = scoutDb.reducer(
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

export const appendManualNote = scoutDb.reducer(
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

export const submitTrailConditionReport = scoutDb.reducer(
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

export const submitWaterReport = scoutDb.reducer(
  {
    trailId: t.string(),
    mile: t.f64(),
    sourceName: t.string(),
    status: t.string(),
    reporterTrailName: t.string().optional(),
    observedAt: t.string().optional()
  },
  (ctx, payload) => {
    const status = payload.status.trim();
    if (status !== 'flowing' && status !== 'low' && status !== 'dry') return;

    const mile = Math.round(payload.mile * 10) / 10;
    if (!Number.isFinite(mile) || mile < 0) return;

    ctx.db.waterReport.insert({
      id: 0n,
      trailId: payload.trailId.trim() || 'appalachian-trail',
      mile,
      sourceName: payload.sourceName.trim() || 'Water',
      status,
      reporterTrailName: payload.reporterTrailName?.trim() || undefined,
      observedAt: payload.observedAt?.trim() || new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  }
);

export const joinScoutWorkspace = scoutDb.reducer(
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

export const mirrorScoutTurn = scoutDb.reducer(
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

export const mirrorScoutTurnEvent = scoutDb.reducer(
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

// --- Live location sharing reducers -------------------------------------------
// Every reducer keys off ctx.sender (the caller's verified identity), so a caller
// can only ever join/leave/publish/clear rows AS THEMSELVES — there is no payload
// field that lets one identity write another's membership or position.

// Join (or refresh display name in) a group by its shared code. The code is the
// bearer secret; minimal length guards against trivially-guessable codes.
export const joinGroup = scoutDb.reducer(
  {
    groupCode: t.string(),
    trailName: t.string()
  },
  (ctx, payload) => {
    const groupCode = payload.groupCode.trim();
    const trailName = payload.trailName.trim() || 'Hiker';
    if (groupCode.length < 8) return;

    for (const member of ctx.db.groupMember.identity.filter(ctx.sender)) {
      if (member.groupCode === groupCode) {
        ctx.db.groupMember.id.update({ ...member, trailName });
        return;
      }
    }

    ctx.db.groupMember.insert({
      id: 0n,
      groupCode,
      identity: ctx.sender,
      trailName,
      joinedAt: new Date().toISOString()
    });
  }
);

// Leave a group: drop the caller's membership AND any position they were sharing
// to it, so they immediately stop being visible to that group.
export const leaveGroup = scoutDb.reducer(
  {
    groupCode: t.string()
  },
  (ctx, payload) => {
    const groupCode = payload.groupCode.trim();
    if (!groupCode) return;

    for (const member of ctx.db.groupMember.identity.filter(ctx.sender)) {
      if (member.groupCode === groupCode) ctx.db.groupMember.id.delete(member.id);
    }
    for (const position of ctx.db.groupPosition.identity.filter(ctx.sender)) {
      if (position.groupCode === groupCode) ctx.db.groupPosition.id.delete(position.id);
    }
  }
);

// Share the caller's current mile to EVERY group they belong to (one row per
// group, updated in place). The position content is identical across groups; the
// views are what scope who can see it. Callers who aren't in any group write
// nothing.
export const publishPosition = scoutDb.reducer(
  {
    mile: t.f64(),
    trailName: t.string(),
    observedAt: t.string().optional()
  },
  (ctx, payload) => {
    const mile = Math.round(payload.mile * 100) / 100;
    if (!Number.isFinite(mile) || mile < 0) return;
    const trailName = payload.trailName.trim() || 'Hiker';
    const now = new Date().toISOString();
    const observedAt = payload.observedAt?.trim() || now;

    for (const member of ctx.db.groupMember.identity.filter(ctx.sender)) {
      let updated = false;
      for (const position of ctx.db.groupPosition.identity.filter(ctx.sender)) {
        if (position.groupCode === member.groupCode) {
          ctx.db.groupPosition.id.update({ ...position, trailName, mile, observedAt, updatedAt: now });
          updated = true;
          break;
        }
      }
      if (!updated) {
        ctx.db.groupPosition.insert({
          id: 0n,
          groupCode: member.groupCode,
          identity: ctx.sender,
          trailName,
          mile,
          observedAt,
          updatedAt: now
        });
      }
    }
  }
);

// Stop sharing entirely: remove every position row the caller is broadcasting
// (membership is kept — they stay in the group, just invisible on the map).
export const stopSharingPosition = scoutDb.reducer(
  {
    confirm: t.bool()
  },
  (ctx, payload) => {
    if (!payload.confirm) return;
    for (const position of ctx.db.groupPosition.identity.filter(ctx.sender)) {
      ctx.db.groupPosition.id.delete(position.id);
    }
  }
);
