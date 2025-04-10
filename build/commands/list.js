"use strict";
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
exports.listCommand = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const listCommand = (sock, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findFirst({
            where: {
                contact: `+${contact}`,
            },
            include: {
                imaps: true,
            },
        });
        if (!user) {
            return yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Nomor yang anda gunakan tidak terdaftar",
            }, {
                quoted: m.messages[0],
            });
        }
        let imapList = "";
        for (let i = 0; i < user.imaps.length; i++) {
            const imap = user.imaps[i];
            const formattedDate = new Date(imap.expiredAt).toLocaleString("id-ID", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
            imapList += `===================\n- Email: ${imap.email}\n- Expiry Date: ${formattedDate}`;
        }
        const chatMessage = `*DAFTAR IMAP ${user.name}\n\n` + imapList;
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: chatMessage,
        });
    }
    catch (error) {
        console.error("Error in pay command:", error);
    }
});
exports.listCommand = listCommand;
