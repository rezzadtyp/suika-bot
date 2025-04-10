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
exports.payCommand = void 0;
const find_expired_imaps_1 = require("../func/find-expired-imaps");
const create_qris_payment_1 = require("../func/create-qris-payment");
const config_1 = require("../config");
const prisma_1 = __importDefault(require("../prisma"));
const status_check_1 = require("../func/status-check");
const update_expired_imaps_1 = require("../func/update-expired-imaps");
const payCommand = (sock, message, contact, m) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const findUser = yield prisma_1.default.user.findFirst({
            where: {
                contact: "+" + contact,
            },
        });
        if (!findUser)
            return;
        const rawCommand = message.split("_");
        const msg = rawCommand[0];
        const addTime = rawCommand[1];
        const findPrice = yield prisma_1.default.price.findUnique({
            where: {
                name: addTime.toLowerCase(),
            },
        });
        if (!findPrice) {
            return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Mohon masukkan jangka waktu yang benar. (7d / 1b)",
            }, {
                quoted: m.messages[0],
            });
        }
        let price;
        if (findPrice.name === "7d") {
            price = findPrice.amount;
        }
        else if (findPrice.name === "1b") {
            price = findPrice.amount;
        }
        else {
            return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                text: "Mohon masukkan jangka waktu yang benar. (7d / 1b)",
            }, {
                quoted: m.messages[0],
            });
        }
        if (msg === "all") {
            const findExps = (yield (0, find_expired_imaps_1.findExpiredImaps)(findUser.id));
            const imapEmails = findExps.imaps.map((imap) => imap.email);
            if (!findExps || findExps.imaps.length === 0)
                return;
            const totalAmount = findExps.imaps.length * price;
            // Create QRIS Payment
            const fee = Math.floor(Math.random() * 99) + 1;
            const qrisData = yield (0, create_qris_payment_1.createQrisPayment)(totalAmount, fee);
            if (!qrisData.status || !qrisData.result)
                return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                    text: "Gagal membuat QRIS",
                }, {
                    quoted: m.messages[0],
                });
            const qrisMessage = yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                image: qrisData.result.buffer,
                caption: `*DETAIL PEMBAYARAN*\n\n` +
                    `- Kode Transaksi: ${qrisData.result.transactionCode}\n` +
                    `- Jumlah: ${imapEmails.length}\n` +
                    `- Harga: Rp ${qrisData.result.baseAmount.toLocaleString("id-ID")}\n` +
                    `- Biaya Unique: Rp ${qrisData.result.fee}\n` +
                    `- Total: Rp ${qrisData.result.totalAmount.toLocaleString("id-ID")}\n` +
                    `- Expired: 5 Menit\n\n` +
                    `Silakan scan QRIS di atas untuk melanjutkan pembayaran.\n` +
                    `Pembayaran akan dicek otomatis setiap 10 detik.\n` +
                    `Ketik *!cancel* untuk membatalkan transaksi ini.`,
            }, {
                quoted: m.messages[0],
            });
            const tx = yield prisma_1.default.transactionHistory.create({
                data: {
                    contact: contact,
                    status: "PENDING",
                    imap: imapEmails,
                    totalAmount: totalAmount + fee,
                    messageKey: JSON.stringify(qrisMessage === null || qrisMessage === void 0 ? void 0 : qrisMessage.key),
                },
            });
            const intervalId = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                const statusData = yield (0, status_check_1.statusCheck)(sock, m, tx.id, totalAmount + fee, qrisMessage);
                if (statusData === "SUCCESS") {
                    let imaps = "";
                    for (const imap of imapEmails) {
                        yield (0, update_expired_imaps_1.updateExpiredImaps)(imap);
                        imaps += `- ${imap}\n`;
                    }
                    const reportMessage = `Transaksi Berhasil\n` +
                        `=====================\n` +
                        `Contact: ${contact}\n` +
                        `Name: ${findUser.name}\n` +
                        `Email: ${imaps}\n` +
                        `Amount: ${totalAmount + fee}\n` +
                        `TXID: ${tx.id}\n` +
                        `Status: ${statusData}\n` +
                        `Create Date: ${new Date(tx.createdAt).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}\n` +
                        `Payment Date: ${new Date(tx.updatedAt).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}\n`;
                    yield sock.sendMessage(config_1.groupId, {
                        text: reportMessage,
                    });
                    clearInterval(intervalId);
                }
                else if (statusData === "FAILED") {
                    clearInterval(intervalId);
                    console.log("Payment failed.");
                }
            }), 10000);
        }
        else {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            const email = msg;
            const invalidEmail = !emailRegex.test(email.trim());
            if (invalidEmail) {
                return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                    text: "Mohon masukkan email yang benar",
                }, {
                    quoted: m.messages[0],
                });
            }
            const findImap = yield prisma_1.default.imap.findFirst({
                where: {
                    email,
                },
            });
            if (!findImap) {
                sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                    text: `Maap gan, ga nemu email ${email} huhuuu`,
                }, {
                    quoted: m.messages[0],
                });
                return;
            }
            const fee = Math.floor(Math.random() * 99) + 1;
            const qrisData = yield (0, create_qris_payment_1.createQrisPayment)(price, fee);
            if (!qrisData.status || !qrisData.result)
                return sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                    text: "Gagal membuat QRIS",
                }, {
                    quoted: m.messages[0],
                });
            const qrisMessage = yield sock.sendMessage(m.messages[0].key.participant || m.messages[0].key.remoteJid, {
                image: qrisData.result.buffer,
                caption: `*DETAIL PEMBAYARAN*\n\n` +
                    `- Kode Transaksi: ${qrisData.result.transactionCode}\n` +
                    `- Jumlah: ${email.length}\n` +
                    `- Harga: Rp ${qrisData.result.baseAmount.toLocaleString("id-ID")}\n` +
                    `- Biaya Unique: Rp ${qrisData.result.fee}\n` +
                    `- Total: Rp ${qrisData.result.totalAmount.toLocaleString("id-ID")}\n` +
                    `- Expired: 5 Menit\n\n` +
                    `Silakan scan QRIS di atas untuk melanjutkan pembayaran.\n` +
                    `Pembayaran akan dicek otomatis setiap 10 detik.\n` +
                    `Ketik *${config_1.prefix}cancel* untuk membatalkan transaksi ini.`,
            }, {
                quoted: m.messages[0],
            });
            const tx = yield prisma_1.default.transactionHistory.create({
                data: {
                    contact,
                    status: "PENDING",
                    imap: [email],
                    totalAmount: price + fee,
                    messageKey: JSON.stringify(qrisMessage === null || qrisMessage === void 0 ? void 0 : qrisMessage.key),
                },
            });
            const intervalId = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
                const statusData = yield (0, status_check_1.statusCheck)(sock, m, tx.id, price + fee, qrisMessage);
                if (statusData === "SUCCESS") {
                    yield (0, update_expired_imaps_1.updateExpiredImaps)(email);
                    const reportMessage = `Transaksi Berhasil\n` +
                        `=====================\n` +
                        `Contact: ${contact}\n` +
                        `Name: ${findUser.name}\n` +
                        `Email: ${email}\n` +
                        `Amount: ${price + fee}\n` +
                        `TXID: ${tx.id}\n` +
                        `Status: ${statusData}\n` +
                        `Create Date: ${new Date(tx.createdAt).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}\n` +
                        `Payment Date: ${new Date(tx.updatedAt).toLocaleString("id-ID", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}\n`;
                    yield sock.sendMessage(config_1.groupId, {
                        text: reportMessage,
                    });
                    clearInterval(intervalId);
                    console.log("Payment successful.");
                }
                else if (statusData === "FAILED") {
                    clearInterval(intervalId);
                    console.log("Payment failed.");
                }
            }), 10000);
        }
    }
    catch (error) {
        console.error("Error in pay command:", error);
    }
});
exports.payCommand = payCommand;
