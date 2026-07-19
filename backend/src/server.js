import 'dotenv/config';
import { createRequire } from 'node:module';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { menus, dictionaries, auditLogs, jobs, monitor } from './store.js';
import { buildRiskScores } from './risk.js';
import {
  buildRiskEvents,
  RISK_EVENT_KEY_MAX_LENGTH,
  RISK_EVENT_KEY_PATTERN
} from './risk-events.js';
import { LOGIN_USERNAME_MAX_LENGTH, parseLoginPayload } from './auth-payload.js';
import { parseRiskStatusPayload } from './risk-status-payload.js';
import { cachedJson } from './cache.js';
import { buildRoadmap, featureIdeas } from './ideas.js';
import {
  dataSourceMeta,
  findUserById,
  findUserForLogin,
  getPermissionMatrix,
  getRiskEvents,
  listRoles,
  listUsers,
  updateRiskEventStatus
} from './repositories.js';

const { version: API_VERSION } = createRequire(import.meta.url)('../package.json');

const app = express();
const PORT = process.env.PORT || 4160;
const JWT_SECRET = process.env.JWT_SECRET || 'ashveil-local-secret';
const JWT_ALGORITHM = 'HS256';
const JWT_MAX_TTL_SECONDS = 8 * 60 * 60;
const JWT_CLOCK_SKEW_SECONDS = 60;
const JWT_ROLE_MAX_LENGTH = 80;
const JSON_BODY_LIMIT = '32kb';
const SECURITY_HEADERS = Object.freeze({
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Permitted-Cross-Domain-Policies': 'none'
});

app.use((_, res, next) => {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    res.setHeader(header, value);
  }
  next();
});
app.use(cors());
app.use(express.json({ limit: JSON_BODY_LIMIT }));
app.use(morgan('dev'));
app.use((err, _req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: `请求体不能超过 ${JSON_BODY_LIMIT}` });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: '请求体必须是合法 JSON' });
  }
  next(err);
});

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, roles: user.roles }, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    expiresIn: '8h'
  });
}

function parseBearerToken(raw) {
  const value = String(raw || '').trim();
  if (!value) return { error: 'Missing token' };

  const match = value.match(/^Bearer\s+(.+)$/i);
  if (!match || match[1].trim().length === 0) {
    return { error: 'Authorization header must use Bearer token' };
  }

  const token = match[1].trim();
  if (/\s/.test(token)) {
    return { error: 'Authorization header must contain a single Bearer token' };
  }

  return { token };
}

function isValidUserId(value) {
  const id = typeof value === 'number' ? value : Number(value);
  return (
    Number.isSafeInteger(id) &&
    id > 0 &&
    (typeof value === 'number' || String(value).trim() === String(id))
  );
}

function isValidJwtTimestamp(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidJwtTimeline(value) {
  const now = Math.floor(Date.now() / 1000);
  return (
    isValidJwtTimestamp(value.iat) &&
    isValidJwtTimestamp(value.exp) &&
    value.iat <= now + JWT_CLOCK_SKEW_SECONDS &&
    value.exp > value.iat &&
    value.exp - value.iat <= JWT_MAX_TTL_SECONDS
  );
}

function isValidJwtRole(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= JWT_ROLE_MAX_LENGTH &&
    value === value.trim() &&
    !value.includes('\0')
  );
}

function isValidJwtUsername(value) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= LOGIN_USERNAME_MAX_LENGTH &&
    value === value.trim() &&
    !value.includes('\0')
  );
}

function isValidAuthClaims(value) {
  const roleSet = Array.isArray(value?.roles) ? new Set(value.roles) : null;
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isValidUserId(value.id) &&
    isValidJwtUsername(value.username) &&
    Array.isArray(value.roles) &&
    value.roles.length > 0 &&
    roleSet.size === value.roles.length &&
    value.roles.every((role) => isValidJwtRole(role)) &&
    isValidJwtTimeline(value)
  );
}

function haveSameStringSet(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return false;
  }

  const rightValues = new Set(right);
  return rightValues.size === right.length && left.every((item) => rightValues.has(item));
}

async function findCurrentPrincipal(claims) {
  const result = await findUserById(claims.id);
  if (!result) return null;

  const user = result.safe;
  if (user.username !== claims.username) return null;
  if (!haveSameStringSet(user.roles, claims.roles)) return null;
  return user;
}

async function auth(req, res, next) {
  const parsed = parseBearerToken(req.headers.authorization);
  if (parsed.error) return res.status(401).json({ message: parsed.error });
  try {
    const claims = jwt.verify(parsed.token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] });
    if (!isValidAuthClaims(claims)) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const principal = await findCurrentPrincipal(claims);
    if (!principal) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    req.user = { ...claims, username: principal.username, roles: principal.roles };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

function parseRiskEventKeyParam(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return { error: '风险事件标识必须是非空字符串' };
  }
  if (value.length > RISK_EVENT_KEY_MAX_LENGTH) {
    return { error: `风险事件标识不能超过 ${RISK_EVENT_KEY_MAX_LENGTH} 个字符` };
  }
  if (!RISK_EVENT_KEY_PATTERN.test(value)) {
    return { error: '风险事件标识只能包含字母、数字、冒号、下划线和连字符' };
  }
  return { value };
}

app.get('/api/health', (_, res) =>
  res.json({ ok: true, name: 'Ashveil Console API', version: API_VERSION })
);

app.post('/api/auth/login', async (req, res) => {
  const payload = parseLoginPayload(req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });
  const result = await findUserForLogin(payload.value.username, payload.value.password);
  if (!result) return res.status(401).json({ message: '账号或密码错误' });
  res.json({
    token: sign(result.safe),
    user: result.safe,
    menus,
    meta: dataSourceMeta(result.source)
  });
});

app.get('/api/auth/me', auth, async (req, res) => {
  const result = await findUserById(req.user.id);
  if (!result) return res.status(404).json({ message: '用户不存在' });
  res.json({ user: result.safe, menus, meta: dataSourceMeta(result.source) });
});

app.get('/api/dashboard', auth, (_, res) => {
  res.json({
    cards: [
      { label: '活跃用户', value: 1286, delta: '+12.4%' },
      { label: '权限变更', value: 42, delta: '-3.1%' },
      { label: '风险事件', value: 17, delta: '+5' },
      { label: '任务成功率', value: '99.2%', delta: '+0.8%' }
    ],
    trend: [12, 18, 9, 26, 31, 22, 36, 29, 41, 33, 46, 52],
    feed: auditLogs.slice(0, 5)
  });
});

app.get('/api/access/users', auth, async (_, res) => res.json(await listUsers()));
app.get('/api/access/roles', auth, async (_, res) => res.json(await listRoles()));
app.get('/api/access/menus', auth, (_, res) => res.json(menus));
app.get('/api/access/permission-matrix', auth, async (_, res) => {
  const result = await getPermissionMatrix();
  res.json({ ...result.matrix, meta: dataSourceMeta(result.source) });
});
app.get('/api/dictionaries', auth, (_, res) => res.json(dictionaries));
app.get('/api/audit/logs', auth, (_, res) => res.json(auditLogs));
app.get('/api/audit/summary', auth, (_, res) => {
  const levelCount = auditLogs.reduce((acc, item) => {
    acc[item.level] = (acc[item.level] || 0) + 1;
    return acc;
  }, {});
  const channelCount = auditLogs.reduce((acc, item) => {
    acc[item.channel] = (acc[item.channel] || 0) + 1;
    return acc;
  }, {});
  res.json({
    total: auditLogs.length,
    critical: levelCount.critical || 0,
    warning: levelCount.warning || 0,
    info: levelCount.info || 0,
    levelCount,
    channelCount,
    latest: auditLogs.slice(0, 6)
  });
});
app.get('/api/jobs', auth, (_, res) => res.json(jobs));
app.get('/api/monitor', auth, (_, res) => res.json(monitor));
app.get('/api/risk/scores', auth, (_, res) =>
  res.json(cachedJson('risk:scores', 15000, buildRiskScores))
);
app.get('/api/risk/events', auth, async (_, res) => {
  const result = await getRiskEvents();
  res.json({
    overview: result.overview,
    events: result.events,
    meta: dataSourceMeta(result.source)
  });
});
app.patch('/api/risk/events/:eventKey/status', auth, async (req, res) => {
  const eventKey = parseRiskEventKeyParam(req.params.eventKey);
  if (eventKey.error) return res.status(400).json({ message: eventKey.error });
  const payload = parseRiskStatusPayload(req.body);
  if (payload.error) return res.status(400).json({ message: payload.error });
  const result = await updateRiskEventStatus(eventKey.value, payload.value.status, {
    note: payload.value.note,
    actor: req.user?.username
  });
  if (result.error) return res.status(result.statusCode || 500).json({ message: result.error });
  res.json({ event: result.event, meta: dataSourceMeta(result.source) });
});
app.get('/api/ideas', auth, (_, res) => res.json({ ideas: featureIdeas, roadmap: buildRoadmap() }));
app.get('/api/watch/night', auth, (_, res) => {
  const risk = buildRiskScores();
  const eventData = buildRiskEvents();
  res.json(
    cachedJson('watch:night', 10000, () => ({
      shift: {
        name: '灰域夜间值守',
        window: '22:00 - 08:00',
        keeper: 'Ash Operator',
        mode: 'low-noise'
      },
      pulse: {
        riskAverage: risk.overview.average,
        criticalEvents: eventData.overview.pending,
        processingEvents: eventData.overview.processing,
        onlineNodes: 3
      },
      spotlight: eventData.events.slice(0, 4),
      checklist: [
        { label: '复核高危权限变更', done: eventData.overview.pending === 0 },
        { label: '确认任务执行队列', done: true },
        { label: '观察降级节点延迟', done: false },
        { label: '同步下一班值守备注', done: false }
      ]
    }))
  );
});

app.use((_, res) => res.status(404).json({ message: 'Not Found' }));

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Ashveil Console API listening on http://localhost:${PORT}`));
}

export default app;
