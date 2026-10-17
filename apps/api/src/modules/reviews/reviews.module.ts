import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { AdminReviewsController } from './admin-reviews.controller.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

@Module({
  imports: [BookingModule, NotificationsModule],
  controllers: [ReviewsController, AdminReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
