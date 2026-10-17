import { Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createStaffSchema,
  resetPasswordSchema,
  updateStaffSchema,
  workingHoursSchema,
  type CreateStaffData,
  type ResetPasswordInput,
  type StaffDto,
  type UpdateStaffData,
  type WorkingHoursInput,
} from '@safari/shared';
import { ZodBody } from '../../common/validation/zod-validation.js';
import { Auth } from '../auth/auth.decorators.js';
import { StaffService } from './staff.service.js';

@ApiTags('admin / staff')
@Auth('ADMIN')
@Controller('admin/staff')
export class AdminStaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(): Promise<StaffDto[]> {
    return this.staff.listAll();
  }

  @Post()
  create(@ZodBody(createStaffSchema) body: CreateStaffData): Promise<StaffDto> {
    return this.staff.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(updateStaffSchema) body: UpdateStaffData,
  ): Promise<StaffDto> {
    return this.staff.update(id, body);
  }

  @Put(':id/working-hours')
  setWorkingHours(
    @Param('id') id: string,
    @ZodBody(workingHoursSchema) body: WorkingHoursInput,
  ): Promise<StaffDto> {
    return this.staff.setWorkingHours(id, body);
  }

  @Put(':id/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @Param('id') id: string,
    @ZodBody(resetPasswordSchema) body: ResetPasswordInput,
  ): Promise<void> {
    return this.staff.resetPassword(id, body.password);
  }
}
