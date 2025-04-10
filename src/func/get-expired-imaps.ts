import prisma from "../prisma";
import { Imap } from "../types/models.type";

export const getExpiredImaps = async () => {
  try {
    const now = new Date();
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() + 24);

    const imaps = await prisma.imap.findMany({
      where: {
        expiredAt: {
          gte: now,
          lte: twelveHoursAgo,
        },
        user: {
          contact: {
            not: null,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!imaps || imaps.length === 0) return;

    return imaps;
  } catch (error) {
    return error;
  }
};

getExpiredImaps();
