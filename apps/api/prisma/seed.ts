/**
 * Development seed: the manager account, a sample team, the service menu and a few
 * past visits with reviews so every section of the site has content.
 * Safe to re-run: the manager is upserted and sample data is only created once.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { SERVICE_COLOR_COUNT, salonTimeToInstant, toDateKey } from '@safari/shared';
import * as argon2 from 'argon2';
import { PrismaClient, type ServiceCategory } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DAY_MS = 24 * 60 * 60_000;
const SAT_TO_THU = [6, 0, 1, 2, 3, 4];
const hours = (from: number, to: number) => ({ startMinute: from * 60, endMinute: to * 60 });

async function seedManager() {
  const phone = process.env.SEED_ADMIN_PHONE ?? '0700000000';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe-2026';
  await prisma.user.upsert({
    where: { phone },
    update: {},
    create: {
      fullName: 'مدیر سالون',
      phone,
      role: 'ADMIN',
      passwordHash: await argon2.hash(password),
    },
  });
  console.log(`Manager login: ${phone} / ${password}`);
}

async function seedTeam() {
  const passwordHash = await argon2.hash('Barber-2026');
  // The real team. Titles and bios stay empty until the manager writes them in the admin panel.
  // The last barber is listed on the site but cannot be booked until the manager activates them.
  const days = [
    ...SAT_TO_THU.map((weekday) => ({ weekday, ...hours(9, 20) })),
    { weekday: 5, ...hours(14, 20) },
  ];
  const team = [
    {
      fullName: 'جواد صفری',
      phone: '0790000001',
      avatarUrl: '/photos/barber-1.jpg',
      isActive: true,
    },
    {
      fullName: 'محمد حسین صفری',
      phone: '0790000002',
      avatarUrl: '/photos/barber-2.jpg',
      isActive: true,
    },
    {
      fullName: 'امیر حسین',
      phone: '0790000003',
      avatarUrl: '/photos/barber-3.jpg',
      isActive: true,
    },
    { fullName: 'محمد جواد صفری', phone: '0790000004', avatarUrl: null, isActive: false },
  ];

  const staff = [];
  for (const member of team) {
    const profile = { ...member, title: 'آرایشگر', bio: null };
    const { isActive, ...rest } = profile;
    staff.push(
      await prisma.user.upsert({
        where: { phone: member.phone },
        // Re-running the seed also renames barbers created by an earlier version of it, but
        // never flips isActive, so a barber the manager activated stays active.
        update: rest,
        create: { ...profile, isActive, passwordHash, workingHours: { create: days } },
      }),
    );
  }
  console.log('Barber logins: 0790000001..4 / Barber-2026 (the 4th is inactive)');
  return staff.filter((member) => member.isActive);
}

async function seedCatalog() {
  if ((await prisma.service.count()) > 0) return prisma.service.findMany();

  const services: {
    name: string;
    category: ServiceCategory;
    durationMinutes: number;
    price: number;
    description: string;
  }[] = [
    {
      name: 'اصلاح موی کلاسیک',
      category: 'HAIR',
      durationMinutes: 40,
      price: 400,
      description: 'کوتاهی با قیچی و ماشین، متناسب با فرم سر.',
    },
    {
      name: 'فید مدرن',
      category: 'HAIR',
      durationMinutes: 50,
      price: 500,
      description: 'لو، مید یا های فید با انتقال نرم و خط‌کشی دقیق.',
    },
    {
      name: 'رنگ و پوشش موی سفید',
      category: 'HAIR',
      durationMinutes: 45,
      price: 800,
      description: 'پوشش طبیعی، بدون حالت رنگ‌شده.',
    },
    {
      name: 'طراحی و فرم‌دهی ریش',
      category: 'BEARD',
      durationMinutes: 30,
      price: 300,
      description: 'فرم‌دهی ریش بر اساس فرم فک و گونه.',
    },
    {
      name: 'اصلاح صورت با حوله داغ',
      category: 'BEARD',
      durationMinutes: 30,
      price: 350,
      description: 'تیغ، حوله داغ و روغن مراقبت.',
    },
    {
      name: 'فیشال ذغال',
      category: 'FACE',
      durationMinutes: 40,
      price: 700,
      description: 'پاکسازی عمیق منافذ و کنترل چربی پوست.',
    },
    {
      name: 'ماسک و آبرسانی پوست',
      category: 'FACE',
      durationMinutes: 30,
      price: 500,
      description: 'ماسک آرام‌بخش برای پوست خسته و خشک.',
    },
    {
      name: 'شستشو و حالت‌دهی',
      category: 'GROOMING',
      durationMinutes: 20,
      price: 200,
      description: 'شستشو، ماساژ سر و حالت‌دهی با محصول مناسب.',
    },
  ];
  await prisma.service.createMany({
    data: services.map((service, i) => ({ ...service, colorIndex: i % SERVICE_COLOR_COUNT })),
  });
  const created = await prisma.service.findMany();
  const id = (name: string) => created.find((s) => s.name === name)!.id;

  const packages = [
    {
      name: 'کلاسیک',
      price: 550,
      isFeatured: false,
      description: 'اصلاح مو، شستشو و حالت‌دهی برای هر هفته.',
      items: ['اصلاح موی کلاسیک', 'شستشو و حالت‌دهی'],
    },
    {
      name: 'معمار ریش',
      price: 600,
      isFeatured: false,
      description: 'برای کسانی که ریش، امضای چهره‌شان است.',
      items: ['طراحی و فرم‌دهی ریش', 'اصلاح صورت با حوله داغ'],
    },
    {
      name: 'اکسپدیشن سفری',
      price: 1600,
      isFeatured: true,
      description: 'تجربه کامل سالون: فید، ریش، حوله داغ و فیشال ذغال.',
      items: ['فید مدرن', 'طراحی و فرم‌دهی ریش', 'اصلاح صورت با حوله داغ', 'فیشال ذغال'],
    },
    {
      name: 'داماد',
      price: 2500,
      isFeatured: false,
      description: 'آماده‌سازی کامل برای روز عروسی، با مراقبت پوست و حالت‌دهی نهایی.',
      items: [
        'فید مدرن',
        'طراحی و فرم‌دهی ریش',
        'اصلاح صورت با حوله داغ',
        'فیشال ذغال',
        'ماسک و آبرسانی پوست',
        'شستشو و حالت‌دهی',
      ],
    },
  ];
  for (const { items, ...pkg } of packages) {
    await prisma.package.create({
      data: { ...pkg, items: { create: items.map((name) => ({ serviceId: id(name) })) } },
    });
  }
  return created;
}

async function seedSampleVisits(
  staffIds: string[],
  services: { id: string; durationMinutes: number; price: number }[],
) {
  if ((await prisma.appointment.count()) > 0) return;

  const visits = [
    {
      customer: 'احمد شریفی',
      rating: 5,
      comment: 'فید خیلی تمیز بود و دقیقاً همان چیزی شد که می‌خواستم. فضا هم آرام و مرتب است.',
    },
    {
      customer: 'مصطفی نوری',
      rating: 5,
      comment: 'طراحی ریش با فرم صورتم جور درآمد. حوله داغ آخر کار عالی بود.',
    },
    {
      customer: 'سهیل امیری',
      rating: 5,
      comment: 'سر وقت شروع کردند و عجله‌ای در کار نبود. کاملاً ارزشش را دارد.',
    },
    {
      customer: 'بشیر حکیمی',
      rating: 4,
      comment: 'اصلاح کلاسیک خوب بود، فقط چند دقیقه منتظر ماندم.',
    },
    {
      customer: 'ولید صدیقی',
      rating: 5,
      comment: 'برای عروسی برادرم آمدم. همه چیز حساب‌شده و دقیق بود.',
    },
    {
      customer: 'عارف یوسفی',
      rating: 4,
      comment: 'فیشال ذغال پوستم را واقعاً تمیز کرد. دوباره می‌آیم.',
    },
  ];

  const now = Date.now();
  for (const [i, visit] of visits.entries()) {
    const service = services[i % services.length]!;
    const startsAt = salonTimeToInstant(toDateKey(new Date(now - (i + 2) * DAY_MS)), 11 * 60);
    await prisma.appointment.create({
      data: {
        code: `DEMO${String(i + 1).padStart(2, '0')}`,
        customerName: visit.customer,
        customerPhone: `07990000${String(i + 10).padStart(2, '0')}`,
        staffId: staffIds[i % staffIds.length]!,
        services: { create: { serviceId: service.id, price: service.price, position: 0 } },
        startsAt,
        endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
        price: service.price,
        status: 'COMPLETED',
        review: { create: { rating: visit.rating, comment: visit.comment } },
      },
    });
  }
  console.log('Sample visits created. Demo booking to track: code DEMO01, phone 0799000010');
}

async function main() {
  await seedManager();
  const staff = await seedTeam();
  const services = await seedCatalog();
  await seedSampleVisits(
    staff.map((s) => s.id),
    services,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
