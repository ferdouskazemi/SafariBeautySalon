import { Module } from '@nestjs/common';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { AdminStaffController } from './admin-staff.controller.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';

@Module({
  imports: [ReviewsModule],
  controllers: [StaffController, AdminStaffController],
  providers: [StaffService],
})
export class StaffModule {}
