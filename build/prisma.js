"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaExclude = prismaExclude;
const client_1 = require("@prisma/client");
function prismaExclude(type, omit) {
    const result = {};
    for (const key in client_1.Prisma[`${type}ScalarFieldEnum`]) {
        if (!omit.includes(key)) {
            result[key] = true;
        }
    }
    return result;
}
exports.default = new client_1.PrismaClient({
// log: ["query", "info", "warn", "error"],
});
