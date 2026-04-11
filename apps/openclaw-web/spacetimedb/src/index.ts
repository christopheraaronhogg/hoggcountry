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

const openclawDb = schema({
  dadUpdate,
  videoDispatch,
  publicAnnouncement,
  betaProfile,
  manualNote
});

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
