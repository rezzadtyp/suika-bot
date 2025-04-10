import { codeQR } from "../config";
import { convertCRC16, qrisConverter } from "../utils/const";
import QRCode from "qrcode";
import crypto from "crypto";

export const createQrisPayment = async (amount: number, fee: number) => {
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

    const convert = qrisConverter({
      qrisCode: codeQR,
      amount: amount,
      fee: fee,
      feeType: "rupiah",
    });

    const buffer = await QRCode.toBuffer(convert);

    return {
      status: true,
      result: {
        transactionCode:
          "QR-" + crypto.randomBytes(4).toString("hex").toUpperCase(),
        baseAmount: amount,
        fee: fee,
        totalAmount: totalAmount,
        buffer: buffer,
      },
    };
  } catch (error) {
    console.error("Failed to create QRIS payment:", error);
    return { status: false };
  }
};
