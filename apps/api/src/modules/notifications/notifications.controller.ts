import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { NotificationsDto } from '@safari/shared';
import type { AuthUser } from '../auth/auth.constants.js';
import { Auth, CurrentUser } from '../auth/auth.decorators.js';
import { NotificationsService } from './notifications.service.js';

/** The signed-in team member's own messages. Polled by the panel, so not rate limited. */
@ApiTags('notifications')
@Auth()
@SkipThrottle()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<NotificationsDto> {
    return this.notifications.list(user.id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: AuthUser): Promise<void> {
    return this.notifications.markAllRead(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    return this.notifications.markRead(user.id, id);
  }
}
