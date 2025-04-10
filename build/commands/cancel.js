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
exports.cancelCommand = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const cancelCommand = (sock, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const findTx = yield prisma_1.default.transactionHistory.findFirst({
            where: {
                contact: contact,
                status: "PENDING",
            },
        });
        if (!findTx)
            return;
        yield prisma_1.default.transactionHistory.update({
            where: {
                id: findTx.id,
            },
            data: {
                status: "FAILED",
            },
        });
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            delete: JSON.parse(findTx.messageKey),
        });
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: "Transaksi dibatalkan",
        }, {
            quoted: m.messages[0],
        });
    }
    catch (error) {
        console.error("Error in cancel command:", error);
    }
});
exports.cancelCommand = cancelCommand;
