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
exports.checkPaymentStatus = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const checkPaymentStatus = (totalAmount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`https://gateway.okeconnect.com/api/mutasi/qris/${config_1.merchantId}/${config_1.keyOrkut}`, {
            timeout: 10000,
        });
        if (!response.data || !response.data.data) {
            return { status: "pending" };
        }
        const matchingPayment = response.data.data.find((payment) => payment.amount.toString() === totalAmount.toString() &&
            payment.type === "CR");
        return {
            status: matchingPayment ? "success" : "pending",
        };
    }
    catch (error) {
        console.error("Error checking payment status:", error);
        return { status: "pending" };
    }
});
exports.checkPaymentStatus = checkPaymentStatus;
