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
exports.updateExpiredImaps = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const updateExpiredImaps = (email) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const findImap = yield prisma_1.default.imap.findFirst({
            where: {
                email,
            },
        });
        if (!findImap)
            return;
        const currentDate = new Date();
        let newExpiredAt;
        if (!findImap.expiredAt) {
            newExpiredAt = new Date(currentDate.getTime());
            newExpiredAt.setDate(newExpiredAt.getDate() + 30);
        }
        else {
            newExpiredAt = new Date(findImap.expiredAt.getTime());
            newExpiredAt.setDate(newExpiredAt.getDate() + 30);
        }
        yield prisma_1.default.imap.update({
            where: {
                id: findImap.id,
            },
            data: {
                expiredAt: newExpiredAt,
            },
        });
        console.log("success updating imap: " + findImap.email);
        return {
            status: "ok",
        };
    }
    catch (error) {
        return error;
    }
});
exports.updateExpiredImaps = updateExpiredImaps;
