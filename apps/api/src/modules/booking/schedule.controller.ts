import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  historyQuerySchema,
  scheduleQuerySchema,
  updateAppointmentStatusSchema,
  type AppointmentDto,
  type HistoryQuery,
  type ScheduleQuery,
  type UpdateAppointmentStatusData,
} from '@safari/shared';
import { ZodBody, ZodQuery } from '../../common/validation/zod-validation.js';
import type { AuthUser } from '../auth/auth.constants.js';
import { Auth, CurrentUser } from '../auth/auth.decorators.js';
import { BookingService } from './booking.service.js';

/** Team schedule: managers see everyone, barbers see their own day. */
@ApiTags('schedule')
@Auth()
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly booking: BookingService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @ZodQuery(scheduleQuerySchema) query: ScheduleQuery,
  ): Promise<AppointmentDto[]> {
    return this.booking.schedule(user, query);
  }

  /** One barber's customers over time: the latest appointments across all days. */
  @Get('history')
  history(
    @CurrentUser() user: AuthUser,
    @ZodQuery(historyQuerySchema) query: HistoryQuery,
  ): Promise<AppointmentDto[]> {
    return this.booking.history(user, query);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @ZodBody(updateAppointmentStatusSchema) body: UpdateAppointmentStatusData,
  ): Promise<AppointmentDto> {
    return this.booking.updateStatus(user, id, body.status);
  }
}
