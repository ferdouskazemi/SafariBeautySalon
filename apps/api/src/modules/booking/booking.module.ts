import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AvailabilityService } from './availability.service.js';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { TurnstileService } from './turnstile.service.js';
import { ScheduleController } from './schedule.controller.js';

@Module({
  imports: [CatalogModule, NotificationsModule],
  controllers: [BookingController, ScheduleController],
  providers: [BookingService, AvailabilityService, TurnstileService],
  exports: [BookingService],
})
export class BookingModule {}
