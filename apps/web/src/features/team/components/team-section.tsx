import { ArrowLeft, UserCircle } from '@phosphor-icons/react/dist/ssr';
import Image from 'next/image';
import Link from 'next/link';
import { formatNumber, formatRating } from '@/shared/lib/format';
import { Container, SectionTitle } from '@/shared/ui/container';
import { EmptyState } from '@/shared/ui/feedback';
import { Reveal } from '@/shared/ui/reveal';
import { StarRating } from '@/shared/ui/star-rating';
import { getTeam } from '../api';

/** A roster: one row per barber, so the layout scales with however many the manager adds. */
export async function TeamSection() {
  const team = (await getTeam()) ?? [];

  return (
    <section id="team" className="py-24 md:py-32">
      <Container>
        <SectionTitle>دست‌هایی که به آن‌ها اعتماد می‌کنید</SectionTitle>

        {team.length === 0 ? (
          <EmptyState className="mt-12" title="معرفی تیم به‌زودی" />
        ) : (
          <ul className="mt-14 divide-y divide-line border-t border-line">
            {team.map((member, index) => (
              <li key={member.id}>
                <Reveal delay={index * 0.05}>
                  <Link
                    href={`/booking?staff=${member.id}`}
                    aria-label={`رزرو نوبت با ${member.fullName}`}
                    className="group grid grid-cols-[5rem_1fr_auto] items-center gap-5 py-6 md:grid-cols-[7rem_1.2fr_1.5fr_auto] md:gap-10"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-[var(--radius-field)] bg-raised">
                      {member.avatarUrl ? (
                        <Image
                          src={member.avatarUrl}
                          alt={member.fullName}
                          fill
                          sizes="112px"
                          unoptimized
                          className="object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                        />
                      ) : (
                        <UserCircle
                          aria-hidden
                          size={40}
                          className="absolute inset-0 m-auto text-muted"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl font-black transition group-hover:text-accent md:text-3xl">
                        {member.fullName}
                      </h3>
                      {member.title && <p className="mt-1 text-sm text-muted">{member.title}</p>}
                      {member.rating.average !== null && (
                        <p className="mt-2 flex items-center gap-2 text-sm md:hidden">
                          <StarRating value={member.rating.average} size={13} />
                          {formatRating(member.rating.average)}
                        </p>
                      )}
                    </div>

                    <div className="hidden md:block">
                      {member.bio && (
                        <p className="max-w-[48ch] leading-relaxed text-muted">{member.bio}</p>
                      )}
                      {member.rating.average !== null && (
                        <p className="mt-3 flex items-center gap-2 text-sm">
                          <StarRating value={member.rating.average} size={14} />
                          <span className="font-bold">{formatRating(member.rating.average)}</span>
                          <span className="text-muted">
                            از {formatNumber(member.rating.count)} نظر
                          </span>
                        </p>
                      )}
                    </div>

                    <ArrowLeft
                      size={22}
                      className="text-muted transition duration-300 ease-out-expo group-hover:-translate-x-1 group-hover:text-accent"
                    />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
