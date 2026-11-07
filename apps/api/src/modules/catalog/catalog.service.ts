import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SERVICE_COLOR_COUNT,
  type CatalogDto,
  type CreatePackageData,
  type CreateServiceData,
  type OfferingRef,
  type PackageDto,
  type ServiceDto,
  type UpdatePackageData,
  type UpdateServiceData,
} from '@safari/shared';
import type { Prisma, Service } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

const packageInclude = {
  items: { include: { service: true }, orderBy: { service: { createdAt: 'asc' } } },
} satisfies Prisma.PackageInclude;
type PackageWithServices = Prisma.PackageGetPayload<{ include: typeof packageInclude }>;

/** A bookable package or list of services, resolved to what the booking needs. */
export interface ResolvedOffering extends OfferingRef {
  packageId: string | null;
  /** Single services in the order chosen; empty for a package. */
  services: { id: string; price: number }[];
  durationMinutes: number;
  price: number;
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog({ includeInactive = false } = {}): Promise<CatalogDto> {
    const activeOnly = includeInactive ? {} : { isActive: true };
    const [services, packages] = await Promise.all([
      this.prisma.service.findMany({
        where: activeOnly,
        orderBy: [{ category: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.package.findMany({
        where: activeOnly,
        include: packageInclude,
        orderBy: [{ isFeatured: 'desc' }, { price: 'asc' }],
      }),
    ]);
    return { services: services.map(toServiceDto), packages: packages.map(toPackageDto) };
  }

  async resolveOffering(ref: {
    serviceIds?: string[];
    packageId?: string;
  }): Promise<ResolvedOffering> {
    if (ref.packageId) {
      const pkg = await this.prisma.package.findFirst({
        where: { id: ref.packageId, isActive: true },
        include: packageInclude,
      });
      if (!pkg) throw new NotFoundException('پکیج انتخاب شده در دسترس نیست');
      const dto = toPackageDto(pkg);
      return {
        kind: 'package',
        name: dto.name,
        packageId: dto.id,
        services: [],
        durationMinutes: dto.durationMinutes,
        price: dto.price,
      };
    }

    const ids = ref.serviceIds ?? [];
    const found = await this.prisma.service.findMany({
      where: { id: { in: ids }, isActive: true },
    });
    const services = ids.map((id) => found.find((s) => s.id === id));
    if (services.length === 0 || services.some((s) => !s)) {
      throw new NotFoundException('خدمت انتخاب شده در دسترس نیست');
    }
    const chosen = services as Service[];
    return {
      kind: 'services',
      name: joinServiceNames(chosen.map((s) => s.name)),
      packageId: null,
      services: chosen.map((s) => ({ id: s.id, price: s.price })),
      durationMinutes: chosen.reduce((sum, s) => sum + s.durationMinutes, 0),
      price: chosen.reduce((sum, s) => sum + s.price, 0),
    };
  }

  async createService(data: CreateServiceData): Promise<ServiceDto> {
    const used = await this.prisma.service.findMany({ select: { colorIndex: true } });
    const colorIndex = leastUsedColor(used.map((service) => service.colorIndex));
    return toServiceDto(await this.prisma.service.create({ data: { ...data, colorIndex } }));
  }

  async updateService(id: string, data: UpdateServiceData): Promise<ServiceDto> {
    return toServiceDto(await this.prisma.service.update({ where: { id }, data }));
  }

  async deleteService(id: string): Promise<void> {
    await this.prisma.service.delete({ where: { id } });
  }

  async createPackage({ serviceIds, ...data }: CreatePackageData): Promise<PackageDto> {
    const pkg = await this.prisma.package.create({
      data: { ...data, items: { create: serviceIds.map((serviceId) => ({ serviceId })) } },
      include: packageInclude,
    });
    return toPackageDto(pkg);
  }

  async updatePackage(id: string, { serviceIds, ...data }: UpdatePackageData): Promise<PackageDto> {
    const pkg = await this.prisma.package.update({
      where: { id },
      data: {
        ...data,
        ...(serviceIds && {
          items: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) },
        }),
      },
      include: packageInclude,
    });
    return toPackageDto(pkg);
  }

  async deletePackage(id: string): Promise<void> {
    await this.prisma.package.delete({ where: { id } });
  }
}

/** The schedule color shared by the fewest services, so a new service stands out from the rest. */
export function leastUsedColor(used: number[]): number {
  const counts = Array.from({ length: SERVICE_COLOR_COUNT }, () => 0);
  for (const index of used) if (counts[index] !== undefined) counts[index]++;
  return counts.indexOf(Math.min(...counts));
}

/** "اصلاح مو + طراحی ریش" */
export function joinServiceNames(names: string[]): string {
  return names.join(' + ');
}

function toServiceDto(service: Service): ServiceDto {
  return {
    id: service.id,
    name: service.name,
    description: service.description,
    colorIndex: service.colorIndex,
    category: service.category,
    durationMinutes: service.durationMinutes,
    price: service.price,
    isActive: service.isActive,
  };
}

function toPackageDto(pkg: PackageWithServices): PackageDto {
  const services = pkg.items.map((item) => item.service);
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description,
    price: pkg.price,
    regularPrice: services.reduce((sum, s) => sum + s.price, 0),
    durationMinutes: services.reduce((sum, s) => sum + s.durationMinutes, 0),
    isFeatured: pkg.isFeatured,
    isActive: pkg.isActive,
    services: services.map((s) => ({ id: s.id, name: s.name })),
  };
}
