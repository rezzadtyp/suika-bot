import makeWASocket, {
  MessageUpsertType,
  proto,
  WAMessage,
} from "@whiskeysockets/baileys";
import prisma from "../prisma";
import { checkPaymentStatus } from "./check-payment-status";

export const statusCheck = async (
  sock: ReturnType<typeof makeWASocket>,
  m: {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
  },
  trxId: string,
  totalAmount: number,
  message: proto.WebMessageInfo
) => {
  try {
    const statusData = await checkPaymentStatus(totalAmount);
    const txHistory = await prisma.transactionHistory.findUnique({
      where: { id: trxId },
    });
    if (!txHistory) return;

    if (statusData.status === "success") {
      await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          delete: message.key,
        }
      );

      await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "✅ Pembarayan berhasil",
        },
        {
          quoted: m.messages[0],
        }
      );

      await prisma.transactionHistory.update({
        where: {
          id: trxId,
        },
        data: {
          status: "SUCCESS",
        },
      });
      return "SUCCESS";
    }

    if (
      txHistory.status === "PENDING" &&
      Date.now() - txHistory.createdAt.getTime() >= 5 * 60 * 1000
    ) {
      await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          delete: message.key,
        }
      );

      const expiredText =
        `❌ *WAKTU PEMBAYARAN TELAH HABIS!*\n\n` +
        `Transaksi Anda melebihi batas waktu pembayaran. Silakan ulangi pemesanan.`;

      await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: expiredText,
        }
      );

      await prisma.transactionHistory.update({
        where: { id: trxId },
        data: {
          status: "FAILED",
        },
      });

      return "FAILED";
    }

    return;
  } catch (error) {
    console.error("Error:", error);

    await prisma.transactionHistory.update({
      where: { id: trxId },
      data: {
        status: "FAILED",
      },
    });

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: "Gagal membuat QRIS",
      },
      {
        quoted: m.messages[0],
      }
    );

    return "FAILED";
  }
};
