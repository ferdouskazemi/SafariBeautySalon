import { Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { reviewVisibilitySchema, type ReviewDto, type ReviewVisibilityData } from '@safari/shared';
import { ZodBody } from '../../common/validation/zod-validation.js';
import { Auth } from '../auth/auth.decorators.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('admin / reviews')
@Auth('ADMIN')
@Controller('admin/reviews')
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(): Promise<ReviewDto[]> {
    return this.reviews.listAll();
  }

  @Patch(':id')
  setVisibility(
    @Param('id') id: string,
    @ZodBody(reviewVisibilitySchema) body: ReviewVisibilityData,
  ): Promise<ReviewDto> {
    return this.reviews.setVisibility(id, body.isVisible);
  }
}
