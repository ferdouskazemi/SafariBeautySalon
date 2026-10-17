import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PublicStaffDto } from '@safari/shared';
import { StaffService } from './staff.service.js';

@ApiTags('staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  list(): Promise<PublicStaffDto[]> {
    return this.staff.listPublic();
  }
}
