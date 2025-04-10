import makeWASocket, {
  MessageUpsertType,
  WAMessage,
} from "@whiskeysockets/baileys";
import { ownerNumber, prefix } from "../config";
import { formatChatId } from "../utils/const";
import prisma from "../prisma";

export const setPriceCommand = async (
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
    const isOwner = formatChatId(`+${contact}`) === ownerNumber;

    if (!isOwner) {
      return sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Fitur ini hanya tersedia untuk owner",
        }
      );
    }
    let name: string | undefined;
    let newPrice: number | undefined;

    if (message.length > 0) {
      const splitMessage = message.split("_");
      if (splitMessage.length === 2) {
        name = splitMessage[0];
        newPrice = parseInt(splitMessage[1]);
      } else {
        return sock.sendMessage(
          m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
          {
            text: `Mohon gunakan format yang benar. Ex: ${prefix}setprice <nama>_<harga>`,
          }
        );
      }
    }

    const findPrice = await prisma.price.findUnique({
      where: {
        name,
      },
    });

    if (!findPrice) {
      return sock.sendMessage(
        m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
        {
          text: "Nama harga tidak ditemukan",
        }
      );
    }

    await prisma.price.update({
      where: {
        name,
      },
      data: {
        amount: newPrice,
      },
    });

    return sock.sendMessage(
      m.messages[0].key.participant! || m.messages[0].key.remoteJid!,
      {
        text: "Sukses update harga",
      }
    );
  } catch (error) {
    console.error("Error in setprice command:", error);
  }
};
