import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type {
  CreateStaffData,
  PublicStaffDto,
  RatingSummary,
  StaffDto,
  UpdateStaffData,
  WorkingHoursInput,
} from '@safari/shared';
import * as argon2 from 'argon2';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EMPTY_RATING, ReviewsService } from '../reviews/reviews.service.js';

const staffInclude = {
  workingHours: {
    select: { weekday: true, startMinute: true, endMinute: true },
    orderBy: { weekday: 'asc' },
  },
} satisfies Prisma.UserInclude;
type StaffRecord = Prisma.UserGetPayload<{ include: typeof staffInclude }>;

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
  ) {}

  /** Bookable barbers for the public site. */
  async listPublic(): Promise<PublicStaffDto[]> {
    const [staff, ratings] = await Promise.all([
      this.prisma.user.findMany({
        where: { role: 'STAFF', isActive: true },
        orderBy: { createdAt: 'asc' },
      }),
      this.reviews.ratingsByStaff(),
    ]);
    return staff.map((s) => toPublicStaffDto(s, ratings.get(s.id)));
  }

  async listAll(): Promise<StaffDto[]> {
    const [staff, ratings] = await Promise.all([
      this.prisma.user.findMany({
        include: staffInclude,
        orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      }),
      this.reviews.ratingsByStaff(),
    ]);
    return staff.map((s) => toStaffDto(s, ratings.get(s.id)));
  }

  async create({ password, ...data }: CreateStaffData): Promise<StaffDto> {
    try {
      const staff = await this.prisma.user.create({
        data: { ...data, role: 'STAFF', passwordHash: await argon2.hash(password) },
        include: staffInclude,
      });
      return toStaffDto(staff);
    } catch (error) {
      throw mapDuplicatePhone(error);
    }
  }

  async update(id: string, data: UpdateStaffData): Promise<StaffDto> {
    const target = await this.prisma.user.findUniqueOrThrow({ where: { id } });
    if (target.role === 'ADMIN' && data.isActive === false) {
      throw new BadRequestException('حساب مدیر را نمی‌توان غیرفعال کرد');
    }

    try {
      const staff = await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          // Deactivating someone signs them out everywhere.
          ...(data.isActive === false && { tokenVersion: { increment: 1 } }),
        },
        include: staffInclude,
      });
      return toStaffDto(staff, (await this.reviews.ratingsByStaff()).get(id));
    } catch (error) {
      throw mapDuplicatePhone(error);
    }
  }

  async resetPassword(id: string, password: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: await argon2.hash(password), tokenVersion: { increment: 1 } },
    });
  }

  async setWorkingHours(id: string, { days }: WorkingHoursInput): Promise<StaffDto> {
    const [, staff] = await this.prisma.$transaction([
      this.prisma.workingHours.deleteMany({ where: { staffId: id } }),
      this.prisma.user.update({
        where: { id },
        data: { workingHours: { create: days } },
        include: staffInclude,
      }),
    ]);
    return toStaffDto(staff, (await this.reviews.ratingsByStaff()).get(id));
  }
}

function mapDuplicatePhone(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return new ConflictException('این شماره موبایل قبلاً ثبت شده است');
  }
  return error;
}

function toPublicStaffDto(
  user: Prisma.UserGetPayload<object>,
  rating: RatingSummary = EMPTY_RATING,
): PublicStaffDto {
  return {
    id: user.id,
    fullName: user.fullName,
    title: user.title,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    rating,
  };
}

function toStaffDto(user: StaffRecord, rating?: RatingSummary): StaffDto {
  return {
    ...toPublicStaffDto(user, rating),
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    workingHours: user.workingHours,
  };
}
