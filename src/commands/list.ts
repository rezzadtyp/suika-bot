import makeWASocket, {
  MessageUpsertType,
  WAMessage,
} from "@whiskeysockets/baileys";
import prisma from "../prisma";

export const listCommand = async (
  sock: ReturnType<typeof makeWASocket>,
  contact: string,
  m: {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
  }
) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        contact: `+${contact}`,
      },
      include: {
        imaps: true,
      },
    });

    if (!user) {
      return await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Nomor yang anda gunakan tidak terdaftar",
        },
        {
          quoted: m.messages[0],
        }
      );
    }

    let imapList = "";

    for (let i = 0; i < user.imaps.length; i++) {
      const imap = user.imaps[i];
      const formattedDate = new Date(imap.expiredAt!).toLocaleString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      imapList += `===================\n- Email: ${imap.email}\n- Expiry Date: ${formattedDate}`;
    }

    const chatMessage = `*DAFTAR IMAP ${user.name}\n\n` + imapList;

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: chatMessage,
      }
    );
  } catch (error) {
    console.error("Error in pay command:", error);
  }
};
