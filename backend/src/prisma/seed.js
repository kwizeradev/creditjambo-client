const { PrismaClient } = require('../../dist/generated/prisma');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const saltBytes = 16;
  const iterations = 100000;
  const keyLength = 64;
  const digest = 'sha512';

  const salt = crypto.randomBytes(saltBytes).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString('hex');

  return { salt, passwordHash };
}

async function main() {
  console.log('Seeding database...');
  console.log('');

  const adminPassword = 'Admin123!';
  const { salt, passwordHash } = hashPassword(adminPassword);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@creditjambo.com' },
  });

  if (existingAdmin) {
    console.log('✓ Admin user already exists');
    return;
  }

  const admin = await prisma.user.create({
    data: {
      email: 'admin@creditjambo.com',
      name: 'System Administrator',
      role: 'ADMIN',
      salt,
      passwordHash,
    },
  });

  const device = await prisma.device.create({
    data: {
      deviceId: 'admin-web-device',
      deviceInfo: 'Admin Web Dashboard',
      userId: admin.id,
      verified: true,
    },
  });

  console.log('✓ Created admin user');
  console.log('  Email:', admin.email);
  console.log('  Password: Admin123!');
  console.log('  DeviceId:', device.deviceId);
  console.log('');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
