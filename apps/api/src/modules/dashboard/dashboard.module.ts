import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [ReviewsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
