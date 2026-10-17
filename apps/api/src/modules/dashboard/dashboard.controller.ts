import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { DashboardStatsDto } from '@safari/shared';
import { Auth } from '../auth/auth.decorators.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('admin / dashboard')
@Auth('ADMIN')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  getStats(): Promise<DashboardStatsDto> {
    return this.dashboard.getStats();
  }
}
