import { Boom } from "@hapi/boom";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeInMemoryStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { formatPhoneNumber } from "./utils/const";
import { pingCommand } from "./commands/ping";
import { ownerNumber, prefix } from "./config";
import { reminderCommand } from "./commands/reminder";
import { payCommand } from "./commands/pay";
import { cancelCommand } from "./commands/cancel";
import { listCommand } from "./commands/list";
import { menuCommand } from "./commands/menu";
import { setPriceCommand } from "./commands/setprice";
import { priceListCommand } from "./commands/pricelist";

const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: "silent" }),
    browser: Browsers.macOS("Desktop"),
  });

  store.bind(sock.ev);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;

      if (reason === DisconnectReason.badSession) {
        console.error(`Bad Session, Please Delete /auth and Scan Again`);
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.warn("Connection closed, reconnecting....");
        await start();
      } else if (reason === DisconnectReason.connectionLost) {
        console.warn("Connection Lost from Server, reconnecting...");
        await start();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.error(
          "Connection Replaced, Another New Session Opened, Please Close Current Session First"
        );
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.error(`Device Logged Out, Please Delete /auth and Scan Again.`);
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.info("Restart Required, Restarting...");
        await start();
      } else if (reason === DisconnectReason.timedOut) {
        console.warn("Connection TimedOut, Reconnecting...");
        await start();
      } else {
        console.warn(`Unknown DisconnectReason: ${reason}: ${connection}`);
        await start();
      }
    } else if (connection === "open") {
      console.log(
        "[Connected] " + formatPhoneNumber(sock.user!.id) + " Role: [OWNER]"
      );
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    if (!m.messages) return;
    const msg = m.messages[0];
    if (msg.key.fromMe) return;

    const sender = msg.key.participant || msg.key.remoteJid;

    if (m.type === "notify") {
      const messageText = msg.message?.conversation;

      if (messageText?.startsWith(prefix)) {
        const command = messageText.slice(1).trim().split(" ")[0];
        const message = messageText.slice(1).trim().split(" ")[1];

        if (command === "ping" && sender) {
          await pingCommand(sock, sender);
        } else if (command === "pay" && sender) {
          if (message) {
            await payCommand(
              sock,
              message.trim(),
              formatPhoneNumber(sender),
              m
            );
          } else {
            sock.sendMessage(sender!, {
              text: `Yang bener lah commandnya bang, ${prefix}pay <imapmu>`,
            });
          }
        } else if (command === "cancel" && sender) {
          await cancelCommand(sock, formatPhoneNumber(sender), m);
        } else if (command === "list" && sender) {
          await listCommand(sock, formatPhoneNumber(sender), m);
        } else if (command === "menu" && sender) {
          await menuCommand(sock, formatPhoneNumber(sender), m);
        } else if (command === "setprice" && sender) {
          await setPriceCommand(sock, message, formatPhoneNumber(sender), m);
        } else if (command === "pricelist" && sender) {
          await priceListCommand(sock, formatPhoneNumber(sender), m);
        } else {
          await sock.sendMessage(sender!, {
            text: `Command tidak ditemukan, gunakan ${prefix}menu untuk melihat daftar command`,
          });
        }
      }
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;
    if (connection === "open") {
      setInterval(async () => {
        await reminderCommand(sock);
      }, 3_600_000);
    }
  });
};

start();
