import makeWASocket from "@whiskeysockets/baileys";

export const pingCommand = async (
  sock: ReturnType<typeof makeWASocket>,
  chat: string
) => {
  try {
    await sock.sendMessage(chat, { text: "Pong!" });
    console.log("Ping command executed successfully.");
  } catch (error) {
    console.error("Error in ping command:", error);
  }
};
