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
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuCommand = void 0;
const config_1 = require("../config");
const const_1 = require("../utils/const");
const menuCommand = (sock, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isOwner = (0, const_1.formatChatId)(`+${contact}`) === config_1.ownerNumber;
        let menuMessage = "";
        if (isOwner) {
            menuMessage =
                `*DAFTAR MENU:\n` +
                    `- ${config_1.prefix}list -> Daftar imapmu\n` +
                    `- ${config_1.prefix}pay -> melakukan pembayaran\n` +
                    `- ${config_1.prefix}cancel -> batalkan pembayaran\n` +
                    `- ${config_1.prefix}setprice -> set harga produk\n` +
                    `- ${config_1.prefix}pricelist -> list harga produk`;
        }
        else {
            menuMessage =
                `*DAFTAR MENU:\n` +
                    `- ${config_1.prefix}list -> Daftar imapmu\n` +
                    `- ${config_1.prefix}pay -> melakukan pembayaran\n` +
                    `- ${config_1.prefix}cancel -> batalkan pembayaran`;
        }
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: menuMessage,
        }, {
            quoted: m.messages[0],
        });
    }
    catch (error) {
        console.error("Error in pay command:", error);
    }
});
exports.menuCommand = menuCommand;
