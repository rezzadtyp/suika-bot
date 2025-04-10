import dotenv from "dotenv";

dotenv.config();

export const merchantId = process.env.MERCHANT_ID || "";
export const keyOrkut = process.env.APIORKUT || "";
export const codeQR = process.env.CODE_QR || "";
export const prefix = process.env.PREFIX || "!";
export const ownerNumber = process.env.OWNER || "";
export const groupId = process.env.GROUP || "";
