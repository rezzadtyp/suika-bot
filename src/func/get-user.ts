import prisma from "../prisma";

export const getUser = async (contact: string) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        contact,
      },
      include: {
        imaps: true,
      },
    });

    if (!user) return;

    return user;
  } catch (error) {
    return error;
  }
};
