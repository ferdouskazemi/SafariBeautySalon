import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { CatalogDto } from '@safari/shared';
import { CatalogService } from './catalog.service.js';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  getCatalog(): Promise<CatalogDto> {
    return this.catalog.getCatalog();
  }
}
