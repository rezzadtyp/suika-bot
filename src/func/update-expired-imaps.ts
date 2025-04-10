import prisma from "../prisma";

export const updateExpiredImaps = async (email: string, day: number) => {
  try {
    const findImap = await prisma.imap.findFirst({
      where: {
        email,
      },
    });

    if (!findImap) return;

    const currentDate = new Date();
    let newExpiredAt: Date;

    if (!findImap.expiredAt) {
      newExpiredAt = new Date(currentDate.getTime());
      if (day === 7) {
        // Add `day` days using getDate()
        newExpiredAt.setDate(newExpiredAt.getDate() + day);
      } else {
        // Add 1 month using getMonth() + 1
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }
    } else {
      newExpiredAt = new Date(findImap.expiredAt.getTime());
      if (day === 7) {
        // Add `day` days using getDate()
        newExpiredAt.setDate(newExpiredAt.getDate() + day);
      } else {
        // Add 1 month using getMonth() + 1
        newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
      }
    }

    await prisma.imap.update({
      where: {
        id: findImap.id,
      },
      data: {
        expiredAt: newExpiredAt,
      },
    });

    console.log("success updating imap: " + findImap.email);

    return {
      status: "ok",
    };
  } catch (error) {
    return error;
  }
};
