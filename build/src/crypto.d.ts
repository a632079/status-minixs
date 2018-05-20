export default interface Crypto {
    aesDecrypt(data: string, key: string, iv?: string): string;
    aesEncrypt(data: string, key: string, iv?: string): string;
}
export default class Crypto implements Crypto {
    static aesEncrypt(data: string, key: string, iv?: string): string;
    static aesDecrypt(data: string, key: string, iv?: string): string;
}
