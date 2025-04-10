import prisma from "../prisma";

export const findExpiredImaps = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return;
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 24);

    const imaps = await prisma.imap.findMany({
      where: {
        userId: user.id,
        expiredAt: {
          // gte: now,
          lte: tomorrow,
        },
      },
    });

    return {
      user,
      imaps,
    };
  } catch (error) {
    return error;
  }
};
