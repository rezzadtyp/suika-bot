import makeWASocket, {
  MessageUpsertType,
  proto,
  WAMessage,
} from "@whiskeysockets/baileys";
import prisma from "../prisma";

export const cancelCommand = async (
  sock: ReturnType<typeof makeWASocket>,
  contact: string,
  m: {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
  }
) => {
  try {
    const findTx = await prisma.transactionHistory.findFirst({
      where: {
        contact: contact,
        status: "PENDING",
      },
    });

    if (!findTx) return;

    await prisma.transactionHistory.update({
      where: {
        id: findTx.id,
      },
      data: {
        status: "FAILED",
      },
    });

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        delete: JSON.parse(findTx.messageKey) as proto.IMessageKey,
      }
    );

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: "Transaksi dibatalkan",
      },
      {
        quoted: m.messages[0],
      }
    );
  } catch (error) {
    console.error("Error in cancel command:", error);
  }
};
