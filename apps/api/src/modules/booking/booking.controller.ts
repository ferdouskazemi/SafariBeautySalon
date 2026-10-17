import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  appointmentLookupSchema,
  availabilityQuerySchema,
  boardQuerySchema,
  bookableDaysQuerySchema,
  createAppointmentSchema,
  type AppointmentLookupData,
  type AvailabilityDto,
  type AvailabilityQuery,
  type BoardDto,
  type BoardQuery,
  type BookableDaysDto,
  type BookableDaysQuery,
  type BookingConfirmationDto,
  type CreateAppointmentData,
  type PublicAppointmentDto,
} from '@safari/shared';
import { ZodBody, ZodQuery } from '../../common/validation/zod-validation.js';
import { AvailabilityService } from './availability.service.js';
import { BookingService } from './booking.service.js';

/** Public, guest-facing booking endpoints. */
@ApiTags('booking')
@Controller()
export class BookingController {
  constructor(
    private readonly booking: BookingService,
    private readonly availability: AvailabilityService,
  ) {}

  @Get('availability')
  getAvailability(
    @ZodQuery(availabilityQuerySchema) query: AvailabilityQuery,
  ): Promise<AvailabilityDto> {
    return this.availability.getAvailability(query);
  }

  @Get('availability/days')
  getBookableDays(
    @ZodQuery(bookableDaysQuerySchema) query: BookableDaysQuery,
  ): Promise<BookableDaysDto> {
    return this.availability.getBookableDays(query);
  }

  @Get('availability/board')
  getBoard(@ZodQuery(boardQuerySchema) query: BoardQuery): Promise<BoardDto> {
    return this.availability.getBoard(query);
  }

  @Post('appointments')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(
    @ZodBody(createAppointmentSchema) body: CreateAppointmentData,
  ): Promise<BookingConfirmationDto> {
    return this.booking.create(body);
  }

  // POST rather than GET so phone numbers never end up in URLs or access logs.
  @Post('appointments/lookup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  lookup(
    @ZodBody(appointmentLookupSchema) body: AppointmentLookupData,
  ): Promise<PublicAppointmentDto> {
    return this.booking.lookup(body);
  }

  @Post('appointments/cancel')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  cancel(
    @ZodBody(appointmentLookupSchema) body: AppointmentLookupData,
  ): Promise<PublicAppointmentDto> {
    return this.booking.cancelByCustomer(body);
  }
}
