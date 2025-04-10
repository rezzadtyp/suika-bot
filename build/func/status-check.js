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
exports.statusCheck = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const check_payment_status_1 = require("./check-payment-status");
const statusCheck = (sock, m, trxId, totalAmount, message) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const statusData = yield (0, check_payment_status_1.checkPaymentStatus)(totalAmount);
        const txHistory = yield prisma_1.default.transactionHistory.findUnique({
            where: { id: trxId },
        });
        if (!txHistory)
            return;
        if (statusData.status === "success") {
            yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                delete: message.key,
            });
            yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "✅ Pembarayan berhasil",
            }, {
                quoted: m.messages[0],
            });
            yield prisma_1.default.transactionHistory.update({
                where: {
                    id: trxId,
                },
                data: {
                    status: "SUCCESS",
                },
            });
            return "SUCCESS";
        }
        if (txHistory.status === "PENDING" &&
            Date.now() - txHistory.createdAt.getTime() >= 5 * 60 * 1000) {
            yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                delete: message.key,
            });
            const expiredText = `❌ *WAKTU PEMBAYARAN TELAH HABIS!*\n\n` +
                `Transaksi Anda melebihi batas waktu pembayaran. Silakan ulangi pemesanan.`;
            yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: expiredText,
            });
            yield prisma_1.default.transactionHistory.update({
                where: { id: trxId },
                data: {
                    status: "FAILED",
                },
            });
            return "FAILED";
        }
        return;
    }
    catch (error) {
        console.error("Error:", error);
        yield prisma_1.default.transactionHistory.update({
            where: { id: trxId },
            data: {
                status: "FAILED",
            },
        });
        yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
            text: "Gagal membuat QRIS",
        }, {
            quoted: m.messages[0],
        });
        return "FAILED";
    }
});
exports.statusCheck = statusCheck;
