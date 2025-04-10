"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupId = exports.ownerNumber = exports.prefix = exports.codeQR = exports.keyOrkut = exports.merchantId = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.merchantId = process.env.MERCHANT_ID || "";
exports.keyOrkut = process.env.APIORKUT || "";
exports.codeQR = process.env.CODE_QR || "";
exports.prefix = process.env.PREFIX || "!";
exports.ownerNumber = process.env.OWNER || "";
exports.groupId = process.env.GROUP || "";
