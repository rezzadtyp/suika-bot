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
exports.getExpiredImaps = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getExpiredImaps = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const now = new Date();
        const twelveHoursAgo = new Date();
        twelveHoursAgo.setHours(twelveHoursAgo.getHours() + 24);
        const imaps = yield prisma_1.default.imap.findMany({
            where: {
                expiredAt: {
                    gte: now,
                    lte: twelveHoursAgo,
                },
                user: {
                    contact: {
                        not: null,
                    },
                },
            },
            include: {
                user: true,
            },
        });
        if (!imaps || imaps.length === 0)
            return;
        return imaps;
    }
    catch (error) {
        return error;
    }
});
exports.getExpiredImaps = getExpiredImaps;
(0, exports.getExpiredImaps)();
