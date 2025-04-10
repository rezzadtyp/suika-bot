import makeWASocket, { proto } from "@whiskeysockets/baileys";
import { getExpiredImaps } from "../func/get-expired-imaps";
import { formatChatId } from "../utils/const";
import { groupId, ownerNumber } from "../config";
import prisma from "../prisma";
import { findExpiredImaps } from "../func/find-expired-imaps";
import { Imap, User } from "@prisma/client";

interface IUserHasExpireds {
  user: User;
  imaps: Imap[];
}

export const reminderCommand = async (
  sock: ReturnType<typeof makeWASocket>
) => {
  try {
    const today = new Date();
    const sevenPM = new Date(today.setHours(19, 0, 0, 0));
    const eightPM = new Date(today.setHours(20, 0, 0, 0));

    if (today >= sevenPM && today < eightPM) {
      const expiredImaps = await prisma.imap.findMany({
        where: {
          expiredAt: {
            lt: today,
          },
        },
        include: {
          user: true,
        },
      });

      for (const exp of expiredImaps) {
        await prisma.imap.update({
          where: {
            id: exp.id,
          },
          data: {
            userId: null,
            expiredAt: null,
          },
        });

        const expMessage =
          `*EXPIRED IMAP\n` +
          `===============\n` +
          `- Email: ${exp.email}\n` +
          `- User email: ${exp.user?.email}\n` +
          `- User name: ${exp.user?.name}\n` +
          `- User contact: ${exp.user?.contact}`;

        await sock.sendMessage(ownerNumber, {
          text: expMessage,
        });

        await sock.sendMessage(groupId, {
          text: expMessage,
        });
      }

      const imaps = (await getExpiredImaps()) as Imap[];

      if (!imaps || imaps.length === 0) {
        console.log("No expired imaps found.");
        return;
      }

      const users = await prisma.user.findMany({
        where: {
          role: "USER",
          id: {
            in: imaps.map((imap) => imap.userId!),
          },
        },
      });

      if (!users || users.length === 0) {
        console.log("No users found.");
        return;
      }

      let userHasExpireds: IUserHasExpireds[] = [];

      for (const user of users) {
        console.log("finding expired imaps for user", user.name);
        const hehe = (await findExpiredImaps(user.id)) as IUserHasExpireds;

        if (hehe) {
          userHasExpireds.push(hehe);
        }
      }

      if (!userHasExpireds || userHasExpireds.length === 0) {
        console.log("No expired imaps found.");
        return;
      }

      for (const user of userHasExpireds) {
        const expImaps = user.imaps;
        console.log("user", user);
        console.log("expired imaps", expImaps);

        let emailList = "";

        for (const imap of expImaps) {
          emailList += ` • ${imap.email}\n`;
        }

        const formattedNumber = formatChatId(
          user.user.contact?.replace("+", "") as string
        );

        const chatMessage =
          `Halo ${user.user.name}, kamu ada tagihan nih di MediaID Store\n\n` +
          `List email:\n` +
          emailList +
          `\n\nUntuk melakukan pembayaran silahkan gunakan command !pay <email> atau !pay all untuk membayar semua tagihan sekaligus`;

        const send = await sock.sendMessage(formattedNumber, {
          text: chatMessage,
        });

        if (send?.status !== proto.WebMessageInfo.Status.ERROR) {
          console.log(`Reminder sent to ${user.user.name}`);
        }
      }

      return;
    } else {
      return;
    }
  } catch (error) {
    console.error("Error in reminder:", error);
    return;
  }
};
