import makeWASocket, {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeInMemoryStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import * as readline from "readline";
import dotenv from "dotenv";

dotenv.config();

const question = (text: string) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(text, resolve);
  });
};

const prefix = process.env.PREFIX || "!";

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});
store?.readFromFile("./baileys_store_multi.json");

const logger = pino({
  timestamp: () => `, "time": "${new Date().toJSON()}"`,
}).child({});
logger.level = "silent";

// Mapping from number to the last conversation id
const conversations: Record<string, any> = {};

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterMap = {};

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WhatsApp v${version.join(".")}, isLatest: ${isLatest}`);

  const wa = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    connectTimeoutMs: 60_000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10_000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
    markOnlineOnConnect: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid!, key.id!);
        return msg?.message || undefined;
      }
    },
  });

  if (!wa.authState.creds.registered) {
    const phoneNumber = await question(
      "Enter your phone number that start with 62 :\n"
    );
    let code: string = "N/A";
    const pair = await wa.requestPairingCode((phoneNumber as string).trim());
    if (pair) code = pair.match(/.{1,4}/g)?.join("-") || pair;
    console.log("Your pairing code is :", code);
  }

  store.bind(wa.ev);

  const sendMessageWTyping = async (msg: AnyMessageContent, jid: string) => {
    await wa.presenceSubscribe(jid);
    await delay(500);

    await wa.sendPresenceUpdate("composing", jid);
    await delay(2000);

    await wa.sendPresenceUpdate("paused", jid);

    await wa.sendMessage(jid, msg);
  };

  wa.ev.process(async (events) => {
    if (events["connection.update"]) {
      const update = events["connection.update"];
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const isLoggedOut =
          (lastDisconnect?.error as Boom)?.output?.statusCode ===
          DisconnectReason.loggedOut;
        if (!isLoggedOut) {
          console.log("Connection is lost! Trying to reconnect...");
          await delay(5000);
          start();
        } else {
          console.log("Connection closed. You are logged out.");
        }
      }

      console.log("connection update", update);
    }

    if (events["creds.update"]) {
      await saveCreds();
    }

    if (events["messages.upsert"]) {
      const upsert = events["messages.upsert"];

      if (upsert.type === "notify") {
        for (const msg of upsert.messages) {
          if (msg.key.fromMe || msg.message?.conversation?.length === 0)
            continue;

          if (msg.message?.conversation?.startsWith(prefix + " ")) {
            const prompt = msg.message.conversation.substring(
              prefix.length + 1
            );
            const response = await handleMessage(msg.key.remoteJid, prompt);
            await wa.readMessages([msg.key]);
            await sendMessageWTyping({ text: response }, msg.key.remoteJid!);
          } else {
            const response = await handleMessage(
              msg.key.remoteJid,
              msg.message?.conversation
            );
            await wa.readMessages([msg.key]);
            await sendMessageWTyping({ text: response }, msg.key.remoteJid!);
          }
        }
      }
    }
  });

  return wa;
};

const handleMessage = async (jid: any, prompt: any) => {
  try {
    const lastConversation = conversations[jid];

    console.log(`Received prompt from ${jid}:`, prompt);
    return lastConversation;
  } catch (error) {
    console.log("An error occurred while handling the message:", error);
    return "An error occurred, please contact Prabowo.";
  }
};

start();
