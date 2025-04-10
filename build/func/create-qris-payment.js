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
exports.createQrisPayment = void 0;
const config_1 = require("../config");
const const_1 = require("../utils/const");
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
const createQrisPayment = (amount, fee) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const totalAmount = amount + fee;
        // let qrisData = codeQR.slice(0, -4);
        // qrisData = qrisData.replace("010211", "010212");
        // const [part1, part2] = qrisData.split("5802ID");
        // let uang = `54${amount
        //   .toString()
        //   .length.toString()
        //   .padStart(2, "0")}${amount}`;
        // uang += `${55020256}${fee
        //   .toString()
        //   .length.toString()
        //   .padStart(2, "0")}${fee}`;
        // const finalQrisString = `${part1}${uang}${part2}`;
        // const qrisWithCRC = finalQrisString + convertCRC16(finalQrisString);
        const convert = (0, const_1.qrisConverter)({
            qrisCode: config_1.codeQR,
            amount: amount,
            fee: fee,
            feeType: "rupiah",
        });
        const buffer = yield qrcode_1.default.toBuffer(convert);
        return {
            status: true,
            result: {
                transactionCode: "QR-" + crypto_1.default.randomBytes(4).toString("hex").toUpperCase(),
                baseAmount: amount,
                fee: fee,
                totalAmount: totalAmount,
                buffer: buffer,
            },
        };
    }
    catch (error) {
        console.error("Failed to create QRIS payment:", error);
        return { status: false };
    }
});
exports.createQrisPayment = createQrisPayment;
