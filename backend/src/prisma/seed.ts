import { PrismaClient } from '@/generated/prisma';
import { hashPassword } from '@/utils/auth.util';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  console.log('');

  const adminPassword = 'Admin123!';
  const { salt, passwordHash } = hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@creditjambo.com' },
    update: {},
    create: {
      email: 'admin@creditjambo.com',
      name: 'System Administrator',
      passwordHash,
      salt,
      role: 'ADMIN',
    },
  });

  await prisma.account.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 0,
    },
  });

  const adminDeviceId = 'admin-web-device';
  await prisma.device.upsert({
    where: { deviceId: adminDeviceId },
    update: {
      verified: true,
      deviceInfo: 'Admin Web Browser',
    },
    create: {
      userId: admin.id,
      deviceId: adminDeviceId,
      deviceInfo: 'Admin Web Browser',
      verified: true,
    },
  });

  console.log('Admin device created and verified');
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('Database seeding completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Admin Credentials:');
  console.log('Email: admin@creditjambo.com');
  console.log('Password: Admin123!');
  console.log('DeviceId: admin-web-device');
  console.log('');
  console.log('You can now login with these credentials.');
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
