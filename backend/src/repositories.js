import { users, roles, permissionMatrix } from './store.js';
import { getPrisma, getPrismaStatus } from './db.js';
import { buildRiskEvents, RISK_EVENT_STATUSES } from './risk-events.js';

function toSafeUser(user, roleCodes = user.roles || []) {
  const { password, roles, userRoles, ...safe } = user;
  void password;
  void roles;
  void userRoles;
  return {
    ...safe,
    roles: roleCodes,
    lastLogin: user.lastLogin instanceof Date ? user.lastLogin.toISOString() : user.lastLogin
  };
}

export async function findUserForLogin(username, password) {
  const prisma = await getPrisma();
  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } }
    });
    if (user && user.password === password) {
      const roleCodes = user.roles.map((item) => item.role.code);
      return { raw: user, safe: toSafeUser(user, roleCodes), source: 'prisma' };
    }
  }

  const user = users.find((item) => item.username === username && item.password === password);
  if (!user) return null;
  return { raw: user, safe: toSafeUser(user), source: 'mock' };
}

export async function findUserById(id) {
  const prisma = await getPrisma();
  if (prisma) {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { roles: { include: { role: true } } }
    });
    if (user) {
      const roleCodes = user.roles.map((item) => item.role.code);
      return { raw: user, safe: toSafeUser(user, roleCodes), source: 'prisma' };
    }
  }

  const user = users.find((item) => item.id === Number(id));
  if (!user) return null;
  return { raw: user, safe: toSafeUser(user), source: 'mock' };
}

export async function listUsers() {
  const prisma = await getPrisma();
  if (prisma) {
    const rows = await prisma.user.findMany({ include: { roles: { include: { role: true } } } });
    return rows.map((user) =>
      toSafeUser(
        user,
        user.roles.map((item) => item.role.code)
      )
    );
  }
  return users.map((user) => toSafeUser(user));
}

export async function listRoles() {
  const prisma = await getPrisma();
  if (prisma) {
    const rows = await prisma.role.findMany({ include: { users: true } });
    return rows.map((role) => ({
      id: role.id,
      code: role.code,
      name: role.name,
      scope: role.scope,
      users: role.users.length
    }));
  }
  return roles;
}

export function dataSourceMeta(source = 'mock') {
  return {
    source,
    prisma: getPrismaStatus()
  };
}

export async function getPermissionMatrix() {
  const prisma = await getPrisma();
  if (prisma) {
    const [resources, roleRows] = await Promise.all([
      prisma.permissionResource.findMany({ include: { actions: true }, orderBy: { id: 'asc' } }),
      prisma.role.findMany({
        include: { grants: { include: { action: { include: { resource: true } } } } }
      })
    ]);

    if (resources.length && roleRows.length) {
      const matrix = {
        resources: resources.map((resource) => ({
          key: resource.key,
          name: resource.name,
          actions: resource.actions.map((action) => action.key)
        })),
        grants: Object.fromEntries(
          roleRows.map((role) => [
            role.code,
            role.grants.map((grant) => `${grant.action.resource.key}:${grant.action.key}`)
          ])
        )
      };
      return { matrix, source: 'prisma' };
    }
  }

  return { matrix: permissionMatrix, source: 'mock' };
}

function normalizeRiskEvent(row) {
  return {
    id: row.eventKey || `risk:legacy:${row.id}`,
    eventKey: row.eventKey || `risk:legacy:${row.id}`,
    title: row.title,
    target: row.target,
    sourceType: row.sourceType,
    score: row.score,
    level: row.level,
    status: row.status,
    suggestion: row.suggestion,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt
  };
}

async function persistRiskEvents(prisma, events) {
  await Promise.all(
    events.map((event) =>
      prisma.riskEvent.upsert({
        where: { eventKey: event.eventKey },
        update: {
          title: event.title,
          target: event.target,
          sourceType: event.sourceType,
          score: event.score,
          level: event.level,
          suggestion: event.suggestion
        },
        create: {
          eventKey: event.eventKey,
          title: event.title,
          target: event.target,
          sourceType: event.sourceType,
          score: event.score,
          level: event.level,
          status: event.status,
          suggestion: event.suggestion,
          createdAt: new Date(event.createdAt)
        }
      })
    )
  );
}

function riskEventOverview(events) {
  return {
    total: events.length,
    pending: events.filter((event) => event.status === 'pending').length,
    processing: events.filter((event) => event.status === 'processing').length,
    confirmed: events.filter((event) => event.status === 'confirmed').length,
    ignored: events.filter((event) => event.status === 'ignored').length,
    archived: events.filter((event) => event.status === 'archived').length
  };
}

export async function getRiskEvents() {
  const generated = buildRiskEvents();
  const prisma = await getPrisma();

  if (prisma) {
    await persistRiskEvents(prisma, generated.events);
    const rows = await prisma.riskEvent.findMany({
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }]
    });
    const events = rows.map(normalizeRiskEvent);
    return { overview: riskEventOverview(events), events, source: 'prisma' };
  }

  return { ...generated, source: 'mock' };
}

export async function updateRiskEventStatus(eventKey, status) {
  if (!RISK_EVENT_STATUSES.includes(status)) {
    return { error: '不支持的风险事件状态', statusCode: 400 };
  }

  const prisma = await getPrisma();
  if (!prisma) {
    return { error: 'Prisma 不可用，无法持久化风险事件状态', statusCode: 503, source: 'mock' };
  }

  const generated = buildRiskEvents();
  const event = generated.events.find((item) => item.eventKey === eventKey || item.id === eventKey);
  if (event) await persistRiskEvents(prisma, [event]);

  try {
    const row = await prisma.riskEvent.update({ where: { eventKey }, data: { status } });
    return { event: normalizeRiskEvent(row), source: 'prisma' };
  } catch {
    return { error: '风险事件不存在', statusCode: 404, source: 'prisma' };
  }
}
