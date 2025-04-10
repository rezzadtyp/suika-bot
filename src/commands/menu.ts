import makeWASocket, {
  MessageUpsertType,
  WAMessage,
} from "@whiskeysockets/baileys";
import { ownerNumber, prefix } from "../config";
import { formatChatId } from "../utils/const";

export const menuCommand = async (
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
    let menuMessage = "";

    if (isOwner) {
      menuMessage =
        `*DAFTAR MENU:\n` +
        `- ${prefix}list -> Daftar imapmu\n` +
        `- ${prefix}pay -> melakukan pembayaran\n` +
        `- ${prefix}cancel -> batalkan pembayaran\n` +
        `- ${prefix}setprice -> set harga produk\n` +
        `- ${prefix}pricelist -> list harga produk`;
    } else {
      menuMessage =
        `*DAFTAR MENU:\n` +
        `- ${prefix}list -> Daftar imapmu\n` +
        `- ${prefix}pay -> melakukan pembayaran\n` +
        `- ${prefix}cancel -> batalkan pembayaran`;
    }

    await sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: menuMessage,
      },
      {
        quoted: m.messages[0],
      }
    );
  } catch (error) {
    console.error("Error in pay command:", error);
  }
};
