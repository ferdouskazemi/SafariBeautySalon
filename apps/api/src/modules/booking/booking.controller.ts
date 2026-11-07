import { Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
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
import type { Request } from 'express';
import { ZodBody, ZodQuery } from '../../common/validation/zod-validation.js';
import { AvailabilityService } from './availability.service.js';
import { BookingService } from './booking.service.js';
import { TurnstileService } from './turnstile.service.js';

/** Public, guest-facing booking endpoints. */
@ApiTags('booking')
@Controller()
export class BookingController {
  constructor(
    private readonly booking: BookingService,
    private readonly availability: AvailabilityService,
    private readonly turnstile: TurnstileService,
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
  async create(
    @ZodBody(createAppointmentSchema) { turnstileToken, ...body }: CreateAppointmentData,
    @Req() req: Request,
  ): Promise<BookingConfirmationDto> {
    await this.turnstile.verify(turnstileToken, req.ip);
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
