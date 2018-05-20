import crypto from 'crypto'

export default interface Crypto {
    aesDecrypt(data: string, key: string, iv?: string): string
    aesEncrypt(data: string, key: string, iv?: string): string
}

export default class Crypto implements Crypto {
    static aesEncrypt(data: string, key: string, iv?: string): string {
        const cipher = typeof iv !== 'undefined' ? crypto.createCipheriv('aes-128-cbc', key, iv) : crypto.createCipher('aes-128-cbc', key)
        cipher.setAutoPadding(true)
        return cipher.update(data, 'utf8', 'base64') + cipher.final('base64')
    }

    static aesDecrypt(data: string, key: string, iv?: string): string {
        const cipher = typeof iv !== 'undefined' ? crypto.createDecipheriv('aes-128-cbc', key, iv) : crypto.createDecipher('aes-128-cbc', key)
        cipher.setAutoPadding(true)
        return cipher.update(data, 'base64', 'utf8') + cipher.final('utf8')
    }
}