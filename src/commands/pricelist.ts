import makeWASocket, {
  MessageUpsertType,
  WAMessage,
} from "@whiskeysockets/baileys";
import { formatChatId } from "../utils/const";
import { ownerNumber } from "../config";
import prisma from "../prisma";

export const priceListCommand = async (
  sock: ReturnType<typeof makeWASocket>,
  contact: string,
  m: {
    messages: WAMessage[];
    type: MessageUpsertType;
    requestId?: string;
  }
) => {
  try {
    const isOwner = formatChatId(`+${contact}`) === ownerNumber;

    if (!isOwner) {
      return sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Fitur ini hanya tersedia untuk owner",
        }
      );
    }

    const prices = await prisma.price.findMany();

    if (!prices || prices.length === 0) {
      return;
    }

    let pricelist: string = "";

    for (const price of prices) {
      pricelist +=
        `\n- Nama: ${price.name}\n` +
        `- Harga: ${price.amount}\n` +
        `==================`;
    }

    const message = `*DAFTAR HARGA\n` + `==================` + pricelist;

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: message,
      },
      {
        quoted: m.messages[0],
      }
    );
  } catch (error) {
    console.error("Error in pricelist command:", error);
  }
};
