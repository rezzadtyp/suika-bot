"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const boom_1 = require("@hapi/boom");
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const pino_1 = __importDefault(require("pino"));
const const_1 = require("./utils/const");
const ping_1 = require("./commands/ping");
const config_1 = require("./config");
const pay_1 = require("./commands/pay");
const cancel_1 = require("./commands/cancel");
const list_1 = require("./commands/list");
const menu_1 = require("./commands/menu");
const setprice_1 = require("./commands/setprice");
const pricelist_1 = require("./commands/pricelist");
const store = (0, baileys_1.makeInMemoryStore)({
    logger: (0, pino_1.default)().child({ level: "silent", stream: "store" }),
});
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    const { state, saveCreds } = yield (0, baileys_1.useMultiFileAuthState)("auth");
    const sock = (0, baileys_1.default)({
        auth: state,
        printQRInTerminal: true,
        logger: (0, pino_1.default)({ level: "silent" }),
        browser: baileys_1.Browsers.ubuntu("Desktop"),
    });
    store.bind(sock.ev);
    sock.ev.on("connection.update", (update) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            let reason = (_a = new boom_1.Boom(lastDisconnect === null || lastDisconnect === void 0 ? void 0 : lastDisconnect.error)) === null || _a === void 0 ? void 0 : _a.output.statusCode;
            if (reason === baileys_1.DisconnectReason.badSession) {
                console.error(`Bad Session, Please Delete /auth and Scan Again`);
                process.exit();
            }
            else if (reason === baileys_1.DisconnectReason.connectionClosed) {
                console.warn("Connection closed, reconnecting....");
                yield start();
            }
            else if (reason === baileys_1.DisconnectReason.connectionLost) {
                console.warn("Connection Lost from Server, reconnecting...");
                yield start();
            }
            else if (reason === baileys_1.DisconnectReason.connectionReplaced) {
                console.error("Connection Replaced, Another New Session Opened, Please Close Current Session First");
                process.exit();
            }
            else if (reason === baileys_1.DisconnectReason.loggedOut) {
                console.error(`Device Logged Out, Please Delete /auth and Scan Again.`);
                process.exit();
            }
            else if (reason === baileys_1.DisconnectReason.restartRequired) {
                console.info("Restart Required, Restarting...");
                yield start();
            }
            else if (reason === baileys_1.DisconnectReason.timedOut) {
                console.warn("Connection TimedOut, Reconnecting...");
                yield start();
            }
            else {
                console.warn(`Unknown DisconnectReason: ${reason}: ${connection}`);
                yield start();
            }
        }
        else if (connection === "open") {
            console.log("[Connected] " + (0, const_1.formatPhoneNumber)(sock.user.id) + " Role: [OWNER]");
        }
    }));
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", (m) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        if (!m.messages)
            return;
        const msg = m.messages[0];
        if (msg.key.fromMe)
            return;
        const sender = msg.key.participant || msg.key.remoteJid;
        if (m.type === "notify") {
            const messageText = (_a = msg.message) === null || _a === void 0 ? void 0 : _a.conversation;
            if (messageText === null || messageText === void 0 ? void 0 : messageText.startsWith(config_1.prefix)) {
                const command = messageText.slice(1).trim().split(" ")[0];
                const message = messageText.slice(1).trim().split(" ")[1];
                if (command === "ping" && sender) {
                    yield (0, ping_1.pingCommand)(sock, sender);
                }
                else if (command === "pay" && sender) {
                    yield (0, pay_1.payCommand)(sock, message.trim(), (0, const_1.formatPhoneNumber)(sender), m);
                }
                else if (command === "cancel" && sender) {
                    yield (0, cancel_1.cancelCommand)(sock, (0, const_1.formatPhoneNumber)(sender), m);
                }
                else if (command === "list" && sender) {
                    yield (0, list_1.listCommand)(sock, (0, const_1.formatPhoneNumber)(sender), m);
                }
                else if (command === "menu" && sender) {
                    yield (0, menu_1.menuCommand)(sock, (0, const_1.formatPhoneNumber)(sender), m);
                }
                else if (command === "setprice" && sender) {
                    yield (0, setprice_1.setPriceCommand)(sock, message, (0, const_1.formatPhoneNumber)(sender), m);
                }
                else if (command === "pricelist" && sender) {
                    yield (0, pricelist_1.priceListCommand)(sock, (0, const_1.formatPhoneNumber)(sender), m);
                }
                else {
                    yield sock.sendMessage(sender, {
                        text: `Command tidak ditemukan, gunakan ${config_1.prefix}menu untuk melihat daftar command`,
                    });
                }
            }
        }
    }));
    sock.ev.on("connection.update", (update) => __awaiter(void 0, void 0, void 0, function* () {
        const { connection } = update;
        // if (connection === "open") {
        //   setInterval(async () => {
        //     await reminderCommand(sock);
        //   }, 86_400_000); // a day 86_400_000
        // }
    }));
});
start();
