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
exports.reminderCommand = void 0;
const baileys_1 = require("@whiskeysockets/baileys");
const get_expired_imaps_1 = require("../func/get-expired-imaps");
const const_1 = require("../utils/const");
const prisma_1 = __importDefault(require("../prisma"));
const find_expired_imaps_1 = require("../func/find-expired-imaps");
const reminderCommand = (sock) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // const imaps = (await getExpiredImaps()) as Imap[];
        // if (!imaps || imaps.length === 0) {
        //   console.log("No expired imaps found.");
        //   return;
        // }
        // const phoneNumbers = imaps.map((imap) => imap.user?.contact);
        // if (!phoneNumbers || phoneNumbers.length === 0) {
        //   console.log("No phone numbers found.");
        //   return;
        // }
        // const formattedNumbers = phoneNumbers.map((number) => {
        //   const cleanedNumber = number?.toString().replace("+", "");
        //   return formatChatId(cleanedNumber as string);
        // });
        // const users = await prisma.user.findMany({
        //   where: {
        //     id: {
        //       in: imaps.map((imap) => imap.user!.id),
        //     },
        //   },
        // });
        // for (let i = 0; i < formattedNumbers.length; i++) {
        //   let chatMessage =
        //     `Halo ${imaps[i].user?.name}, kamu ada tagihan nih di MediaID Store` +
        //     `╭────〔 *LIST EMAIL📦* 〕──\n` +
        //     `| • ${imaps[i].email}\n`;
        //   const send = await sock.sendMessage(ownerNumber, {
        //     text: chatMessage,
        //   });
        //   if (send?.status !== proto.WebMessageInfo.Status.ERROR) {
        //     console.log(`Reminder sent to ${formattedNumbers[i]}`);
        //   }
        // }
        const imaps = (yield (0, get_expired_imaps_1.getExpiredImaps)());
        if (!imaps || imaps.length === 0) {
            console.log("No expired imaps found.");
            return;
        }
        const users = yield prisma_1.default.user.findMany({
            where: {
                role: "USER",
                id: {
                    in: imaps.map((imap) => imap.userId),
                },
            },
        });
        if (!users || users.length === 0) {
            console.log("No users found.");
            return;
        }
        let userHasExpireds = [];
        for (const user of users) {
            console.log("finding expired imaps for user", user.name);
            const hehe = (yield (0, find_expired_imaps_1.findExpiredImaps)(user.id));
            if (hehe) {
                userHasExpireds.push(hehe);
            }
        }
        if (!userHasExpireds || userHasExpireds.length === 0) {
            console.log("No expired imaps found.");
            return;
        }
        for (const user of userHasExpireds) {
            const expImaps = user.imaps;
            console.log("user", user);
            console.log("expired imaps", expImaps);
            let emailList = "";
            for (const imap of expImaps) {
                emailList += ` • ${imap.email}\n`;
            }
            const formattedNumber = (0, const_1.formatChatId)((_a = user.user.contact) === null || _a === void 0 ? void 0 : _a.replace("+", ""));
            const chatMessage = `Halo ${user.user.name}, kamu ada tagihan nih di MediaID Store\n\n` +
                `List email:\n` +
                emailList +
                `\n\nUntuk melakukan pembayaran silahkan gunakan command !pay <email> atau !pay all untuk membayar semua tagihan sekaligus`;
            const send = yield sock.sendMessage(formattedNumber, {
                text: chatMessage,
            });
            if ((send === null || send === void 0 ? void 0 : send.status) !== baileys_1.proto.WebMessageInfo.Status.ERROR) {
                console.log(`Reminder sent to ${user.user.name}`);
            }
        }
        return;
    }
    catch (error) {
        console.error("Error in reminder:", error);
        return;
    }
});
exports.reminderCommand = reminderCommand;
