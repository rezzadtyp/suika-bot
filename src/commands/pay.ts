import makeWASocket, {
  MessageUpsertType,
  WAMessage,
} from "@whiskeysockets/baileys";
import { Imap, User } from "@prisma/client";
import { findExpiredImaps } from "../func/find-expired-imaps";
import { createQrisPayment } from "../func/create-qris-payment";
import { groupId, prefix } from "../config";
import prisma from "../prisma";
import { statusCheck } from "../func/status-check";
import { updateExpiredImaps } from "../func/update-expired-imaps";

interface IUserHasExpireds {
  user: User;
  imaps: Imap[];
}

export const payCommand = async (
  sock: ReturnType<typeof makeWASocket>,
  message: string,
  contact: string,
  m: {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
  }
) => {
  try {
    const findUser = await prisma.user.findFirst({
      where: {
        contact: "+" + contact,
      },
    });

    if (!findUser) return;

    const rawCommand = message.split("_");
    const msg = rawCommand[0];
    const addTime = rawCommand[1];

    const findPrice = await prisma.price.findUnique({
      where: {
        name: addTime.toLowerCase(),
      },
    });

    if (!findPrice) {
      return sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Mohon masukkan jangka waktu yang benar. (7d / 1b)",
        },
        {
          quoted: m.messages[0],
        }
      );
    }

    let price: number;
    let days: number;

    if (findPrice.name === "7d") {
      price = findPrice.amount;
      days = 7;
    } else if (findPrice.name === "1b") {
      price = findPrice.amount;
      days = 30;
    } else {
      return sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Mohon masukkan jangka waktu yang benar. (7d / 1b)",
        },
        {
          quoted: m.messages[0],
        }
      );
    }

    if (msg === "all") {
      const findExps = (await findExpiredImaps(
        findUser.id
      )) as IUserHasExpireds;
      const imapEmails = findExps.imaps.map((imap) => imap.email);

      if (!findExps || findExps.imaps.length === 0) return;
      const totalAmount = findExps.imaps.length * price;

      // Create QRIS Payment
      const fee = Math.floor(Math.random() * 99) + 1;
      const qrisData = await createQrisPayment(totalAmount, fee);

      if (!qrisData.status || !qrisData.result)
        return sock.sendMessage(
          m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
          {
            text: "Gagal membuat QRIS",
          },
          {
            quoted: m.messages[0],
          }
        );

      const qrisMessage = await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          image: qrisData.result.buffer,
          caption:
            `*DETAIL PEMBAYARAN*\n\n` +
            `- Kode Transaksi: ${qrisData.result.transactionCode}\n` +
            `- Jumlah: ${imapEmails.length}\n` +
            `- Harga: Rp ${qrisData.result.baseAmount.toLocaleString(
              "id-ID"
            )}\n` +
            `- Biaya Unique: Rp ${qrisData.result.fee}\n` +
            `- Total: Rp ${qrisData.result.totalAmount.toLocaleString(
              "id-ID"
            )}\n` +
            `- Expired: 5 Menit\n\n` +
            `Silakan scan QRIS di atas untuk melanjutkan pembayaran.\n` +
            `Pembayaran akan dicek otomatis setiap 10 detik.\n` +
            `Ketik *!cancel* untuk membatalkan transaksi ini.`,
        },
        {
          quoted: m.messages[0],
        }
      );

      const tx = await prisma.transactionHistory.create({
        data: {
          contact: contact,
          status: "PENDING",
          imap: imapEmails,
          totalAmount: totalAmount + fee,
          messageKey: JSON.stringify(qrisMessage?.key),
        },
      });

      const intervalId = setInterval(async () => {
        const statusData = await statusCheck(
          sock,
          m,
          tx.id,
          totalAmount + fee,
          qrisMessage!
        );

        if (statusData === "SUCCESS") {
          let imaps = "";
          for (const imap of imapEmails) {
            await updateExpiredImaps(imap, days);
            imaps += `- ${imap}\n`;
          }
          const reportMessage =
            `Transaksi Berhasil\n` +
            `=====================\n` +
            `Contact: ${contact}\n` +
            `Name: ${findUser.name}\n` +
            `Email: ${imaps}\n` +
            `Amount: ${totalAmount + fee}\n` +
            `TXID: ${tx.id}\n` +
            `Status: ${statusData}\n` +
            `Create Date: ${new Date(tx.createdAt).toLocaleString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}\n` +
            `Payment Date: ${new Date(tx.updatedAt).toLocaleString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}\n`;

          await sock.sendMessage(groupId, {
            text: reportMessage,
          });
          clearInterval(intervalId);
        } else if (statusData === "FAILED") {
          clearInterval(intervalId);
          console.log("Payment failed.");
        }
      }, 10000);
    } else {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
      const email = msg;
      const invalidEmail = !emailRegex.test(email.trim());

      if (invalidEmail) {
        return sock.sendMessage(
          m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
          {
            text: "Mohon masukkan email yang benar",
          },
          {
            quoted: m.messages[0],
          }
        );
      }
      const findImap = await prisma.imap.findFirst({
        where: {
          email,
        },
      });

      if (!findImap) {
        sock.sendMessage(
          m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
          {
            text: `Maap gan, ga nemu email ${email} huhuuu`,
          },
          {
            quoted: m.messages[0],
          }
        );
        return;
      }
      const fee = Math.floor(Math.random() * 99) + 1;

      const qrisData = await createQrisPayment(price, fee);
      if (!qrisData.status || !qrisData.result)
        return sock.sendMessage(
          m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
          {
            text: "Gagal membuat QRIS",
          },
          {
            quoted: m.messages[0],
          }
        );

      const qrisMessage = await sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          image: qrisData.result.buffer,
          caption:
            `*DETAIL PEMBAYARAN*\n\n` +
            `- Kode Transaksi: ${qrisData.result.transactionCode}\n` +
            `- Jumlah: ${email.length}\n` +
            `- Harga: Rp ${qrisData.result.baseAmount.toLocaleString(
              "id-ID"
            )}\n` +
            `- Biaya Unique: Rp ${qrisData.result.fee}\n` +
            `- Total: Rp ${qrisData.result.totalAmount.toLocaleString(
              "id-ID"
            )}\n` +
            `- Expired: 5 Menit\n\n` +
            `Silakan scan QRIS di atas untuk melanjutkan pembayaran.\n` +
            `Pembayaran akan dicek otomatis setiap 10 detik.\n` +
            `Ketik *${prefix}cancel* untuk membatalkan transaksi ini.`,
        },
        {
          quoted: m.messages[0],
        }
      );

      const tx = await prisma.transactionHistory.create({
        data: {
          contact,
          status: "PENDING",
          imap: [email],
          totalAmount: price + fee,
          messageKey: JSON.stringify(qrisMessage?.key),
        },
      });

      const intervalId = setInterval(async () => {
        const statusData = await statusCheck(
          sock,
          m,
          tx.id,
          price + fee,
          qrisMessage!
        );

        if (statusData === "SUCCESS") {
          await updateExpiredImaps(email, days);

          const reportMessage =
            `Transaksi Berhasil\n` +
            `=====================\n` +
            `Contact: ${contact}\n` +
            `Name: ${findUser.name}\n` +
            `Email: ${email}\n` +
            `Amount: ${price + fee}\n` +
            `TXID: ${tx.id}\n` +
            `Status: ${statusData}\n` +
            `Create Date: ${new Date(tx.createdAt).toLocaleString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}\n` +
            `Payment Date: ${new Date(tx.updatedAt).toLocaleString("id-ID", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}\n`;

          await sock.sendMessage(groupId, {
            text: reportMessage,
          });

          clearInterval(intervalId);
          console.log("Payment successful.");
        } else if (statusData === "FAILED") {
          clearInterval(intervalId);
          console.log("Payment failed.");
        }
      }, 10000);
    }
  } catch (error) {
    console.error("Error in pay command:", error);
  }
};
