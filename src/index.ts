import { Boom } from "@hapi/boom";
import makeWASocket, {
  Browsers,
  DisconnectReason,
  makeInMemoryStore,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import pino from "pino";

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
      console.log("[Connected] " + JSON.stringify(sock?.user?.id, null, 2));
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    if (!m.messages) return;
    const msg = m.messages[0];
    if (msg.key.fromMe) return;

    const chat = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    console.log(msg.key.remoteJid);

    if (m.type === "notify") {
      console.log("New message:", msg.message?.conversation);
      await sock.sendMessage(chat!, {
        text: `Hello, ${sender!.split("@")[0]}!`,
      });
    }
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;
    if (connection === "open") {
      await sock.sendMessage("6285143247378@s.whatsapp.net", {
        text: "Hello, World!",
      });
    }
  });
};

start();
