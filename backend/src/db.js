let prisma;
let prismaUnavailableReason = '';

export async function getPrisma() {
  if (prisma) return prisma;
  if (!process.env.DATABASE_URL?.trim()) {
    prismaUnavailableReason = 'DATABASE_URL 未配置，当前使用 mock 数据兜底';
    return null;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
    await prisma.$connect();
    return prisma;
  } catch (error) {
    prismaUnavailableReason = error?.message || 'Prisma unavailable';
    return null;
  }
}

export function getPrismaStatus() {
  return {
    enabled: Boolean(prisma),
    fallback: !prisma,
    reason: prisma ? null : prismaUnavailableReason || 'Prisma 尚未初始化，当前使用 mock 数据兜底'
  };
}

export async function disconnectPrisma() {
  if (prisma) await prisma.$disconnect();
}
