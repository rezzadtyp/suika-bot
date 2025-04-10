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
exports.priceListCommand = void 0;
const const_1 = require("../utils/const");
const config_1 = require("../config");
const prisma_1 = __importDefault(require("../prisma"));
const priceListCommand = (sock, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isOwner = (0, const_1.formatChatId)(`+${contact}`) === config_1.ownerNumber;
        if (!isOwner) {
            return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Fitur ini hanya tersedia untuk owner",
            });
        }
        const prices = yield prisma_1.default.price.findMany();
        if (!prices || prices.length === 0) {
            return;
        }
        let pricelist = "";
        for (const price of prices) {
            pricelist +=
                `\n- Nama: ${price.name}\n` +
                    `- Harga: ${price.amount}\n` +
                    `==================`;
        }
        const message = `*DAFTAR HARGA\n` + `==================` + pricelist;
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: message,
        }, {
            quoted: m.messages[0],
        });
    }
    catch (error) {
        console.error("Error in pricelist command:", error);
    }
});
exports.priceListCommand = priceListCommand;
