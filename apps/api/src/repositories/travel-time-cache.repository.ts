import { prisma } from '../lib/prisma';

/** Round to 3 decimals (~100m precision) for cache key */
const round3 = (n: number) => Math.round(n * 1000) / 1000;

export const travelTimeCacheRepository = {
  find: (originLat: number, originLng: number, destLat: number, destLng: number) => {
    return prisma.travelTimeCache.findFirst({
      where: {
        originLat: round3(originLat),
        originLng: round3(originLng),
        destLat: round3(destLat),
        destLng: round3(destLng),
        expiresAt: { gt: new Date() },
      },
    });
  },

  upsert: (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    durationSeconds: number,
    distanceMeters: number
  ) => {
    const oLat = round3(originLat);
    const oLng = round3(originLng);
    const dLat = round3(destLat);
    const dLng = round3(destLng);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return prisma.travelTimeCache.upsert({
      where: {
        originLat_originLng_destLat_destLng: {
          originLat: oLat,
          originLng: oLng,
          destLat: dLat,
          destLng: dLng,
        },
      },
      update: {
        durationSeconds,
        distanceMeters,
        fetchedAt: new Date(),
        expiresAt,
      },
      create: {
        originLat: oLat,
        originLng: oLng,
        destLat: dLat,
        destLng: dLng,
        durationSeconds,
        distanceMeters,
        fetchedAt: new Date(),
        expiresAt,
      },
    });
  },

  cleanup: () => {
    return prisma.travelTimeCache.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
