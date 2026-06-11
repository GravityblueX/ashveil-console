import { users, roles } from './store.js';
import { getPrisma, getPrismaStatus } from './db.js';

function toSafeUser(user, roleCodes = user.roles || []) {
  const { password: _password, roles: _roles, userRoles: _userRoles, ...safe } = user;
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
