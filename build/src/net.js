"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 请求库
const axios_1 = __importDefault(require("axios"));
class Net {
    /**
     * 发起请求
     * @param {string} uri URL 地址
     * @param {string} method 请求方法
     * @param {object} qs QueryString
     * @param {object} data FormData
     * @param {object} headers headers
     * @returns {Promise<AxiosResponse>}
     */
    static request(uri, method, qs, data, headers) {
        const baseHeader = {
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0`,
            'Referer': '',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'X-Requested-With': 'Hitokoto Status Minixs Bot'
        };
        if (headers) {
            Object.assign(baseHeader, headers);
        }
        return this.axios.request({
            url: uri,
            method: method,
            headers: baseHeader,
            params: qs ? qs : {},
            data: data ? data : {},
            responseType: 'arraybuffer'
        });
    }
    static async getStatusCode(uri, method = 'GET') {
        const responseBody = await this.request(uri, method);
        return responseBody.status;
    }
    static async getJSON(uri, method = 'GET', qs, data, headers) {
        const responseBody = await this.request(uri, method);
        if (responseBody.status !== 200) {
            return responseBody;
        }
        return JSON.parse(responseBody.data.toString());
    }
}
Net.axios = axios_1.default;
exports.default = Net;
//# sourceMappingURL=net.js.map