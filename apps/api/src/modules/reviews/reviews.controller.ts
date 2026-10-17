import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  createReviewSchema,
  type CreateReviewData,
  type PublicReviewsDto,
  type ReviewDto,
} from '@safari/shared';
import { ZodBody } from '../../common/validation/zod-validation.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(): Promise<PublicReviewsDto> {
    return this.reviews.listPublic();
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  create(@ZodBody(createReviewSchema) body: CreateReviewData): Promise<ReviewDto> {
    return this.reviews.create(body);
  }
}
