import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter.js';
import { validateEnv } from './config/env.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { DashboardModule } from './modules/dashboard/dashboard.module.js';
import { HealthController } from './modules/health/health.controller.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { StaffModule } from './modules/staff/staff.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    JwtModule.register({ global: true }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    BookingModule,
    ReviewsModule,
    StaffModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule {}
