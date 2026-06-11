import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { users, roles, menus, dictionaries, auditLogs, jobs, monitor, permissionMatrix } from './store.js';

const app = express();
const PORT = process.env.PORT || 4160;
const JWT_SECRET = process.env.JWT_SECRET || 'ashveil-local-secret';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

function sign(user) {
  return jwt.sign({ id: user.id, username: user.username, roles: user.roles }, JWT_SECRET, { expiresIn: '8h' });
}

function auth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/api/health', (_, res) => res.json({ ok: true, name: 'Ashveil Console API', version: '0.8.0' }));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(item => item.username === username && item.password === password);
  if (!user) return res.status(401).json({ message: '账号或密码错误' });
  const { password: _, ...safeUser } = user;
  res.json({ token: sign(user), user: safeUser, menus });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = users.find(item => item.id === req.user.id);
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, menus });
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

app.get('/api/access/users', auth, (_, res) => res.json(users.map(({ password, ...u }) => u)));
app.get('/api/access/roles', auth, (_, res) => res.json(roles));
app.get('/api/access/menus', auth, (_, res) => res.json(menus));
app.get('/api/access/permission-matrix', auth, (_, res) => res.json(permissionMatrix));
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

app.use((_, res) => res.status(404).json({ message: 'Not Found' }));

app.listen(PORT, () => console.log(`Ashveil Console API listening on http://localhost:${PORT}`));
