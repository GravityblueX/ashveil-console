import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const root = await prisma.role.upsert({
    where: { code: 'ROOT' },
    update: {},
    create: { code: 'ROOT', name: '超级管理员', scope: 'ALL' }
  });

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      nickname: 'Ash Operator',
      password: 'ashveil2026',
      dept: '灰域观察组',
      status: 'active'
    }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: root.id } },
    update: {},
    create: { userId: admin.id, roleId: root.id }
  });

  const resource = await prisma.permissionResource.upsert({
    where: { key: 'risk-events' },
    update: {},
    create: { key: 'risk-events', name: '风险事件中心' }
  });

  for (const action of ['view', 'confirm', 'archive']) {
    const createdAction = await prisma.permissionAction.upsert({
      where: { resourceId_key: { resourceId: resource.id, key: action } },
      update: {},
      create: { resourceId: resource.id, key: action, name: action }
    });
    await prisma.permissionGrant.upsert({
      where: { roleId_actionId: { roleId: root.id, actionId: createdAction.id } },
      update: {},
      create: { roleId: root.id, actionId: createdAction.id }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
