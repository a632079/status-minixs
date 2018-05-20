"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
class Crypto {
    static aesEncrypt(data, key, iv) {
        const cipher = typeof iv !== 'undefined' ? crypto_1.default.createCipheriv('aes-128-cbc', key, iv) : crypto_1.default.createCipher('aes-128-cbc', key);
        cipher.setAutoPadding(true);
        return cipher.update(data, 'utf8', 'base64') + cipher.final('base64');
    }
    static aesDecrypt(data, key, iv) {
        const cipher = typeof iv !== 'undefined' ? crypto_1.default.createDecipheriv('aes-128-cbc', key, iv) : crypto_1.default.createDecipher('aes-128-cbc', key);
        cipher.setAutoPadding(true);
        return cipher.update(data, 'base64', 'utf8') + cipher.final('utf8');
    }
}
exports.default = Crypto;
//# sourceMappingURL=crypto.js.map