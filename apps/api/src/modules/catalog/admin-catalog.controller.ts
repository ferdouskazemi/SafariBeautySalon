import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  createPackageSchema,
  createServiceSchema,
  updatePackageSchema,
  updateServiceSchema,
  type CatalogDto,
  type CreatePackageData,
  type CreateServiceData,
  type PackageDto,
  type ServiceDto,
  type UpdatePackageData,
  type UpdateServiceData,
} from '@safari/shared';
import { ZodBody } from '../../common/validation/zod-validation.js';
import { Auth } from '../auth/auth.decorators.js';
import { CatalogService } from './catalog.service.js';

@ApiTags('admin / catalog')
@Auth('ADMIN')
@Controller('admin/catalog')
export class AdminCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  getCatalog(): Promise<CatalogDto> {
    return this.catalog.getCatalog({ includeInactive: true });
  }

  @Post('services')
  createService(@ZodBody(createServiceSchema) body: CreateServiceData): Promise<ServiceDto> {
    return this.catalog.createService(body);
  }

  @Patch('services/:id')
  updateService(
    @Param('id') id: string,
    @ZodBody(updateServiceSchema) body: UpdateServiceData,
  ): Promise<ServiceDto> {
    return this.catalog.updateService(id, body);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteService(@Param('id') id: string): Promise<void> {
    return this.catalog.deleteService(id);
  }

  @Post('packages')
  createPackage(@ZodBody(createPackageSchema) body: CreatePackageData): Promise<PackageDto> {
    return this.catalog.createPackage(body);
  }

  @Patch('packages/:id')
  updatePackage(
    @Param('id') id: string,
    @ZodBody(updatePackageSchema) body: UpdatePackageData,
  ): Promise<PackageDto> {
    return this.catalog.updatePackage(id, body);
  }

  @Delete('packages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePackage(@Param('id') id: string): Promise<void> {
    return this.catalog.deletePackage(id);
  }
}
