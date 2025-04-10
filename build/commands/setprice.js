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
exports.setPriceCommand = void 0;
const config_1 = require("../config");
const const_1 = require("../utils/const");
const prisma_1 = __importDefault(require("../prisma"));
const setPriceCommand = (sock, message, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isOwner = (0, const_1.formatChatId)(`+${contact}`) === config_1.ownerNumber;
        if (!isOwner) {
            return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Fitur ini hanya tersedia untuk owner",
            });
        }
        let name;
        let newPrice;
        if (message.length > 0) {
            const splitMessage = message.split("_");
            if (splitMessage.length === 2) {
                name = splitMessage[0];
                newPrice = parseInt(splitMessage[1]);
            }
            else {
                return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                    text: `Mohon gunakan format yang benar. Ex: ${config_1.prefix}setprice <nama>_<harga>`,
                });
            }
        }
        const findPrice = yield prisma_1.default.price.findUnique({
            where: {
                name,
            },
        });
        if (!findPrice) {
            return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Nama harga tidak ditemukan",
            });
        }
        yield prisma_1.default.price.update({
            where: {
                name,
            },
            data: {
                amount: newPrice,
            },
        });
        return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: "Sukses update harga",
        });
    }
    catch (error) {
        console.error("Error in setprice command:", error);
    }
});
exports.setPriceCommand = setPriceCommand;
