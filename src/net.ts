// 请求库
import axios, { AxiosStatic, AxiosResponse } from 'axios'
import { statusBody } from './utils';

export default interface Net {
    axios :AxiosStatic
    request(uri: string, method: string, qs?: object, data?: object, headers?: object): Promise<AxiosResponse>
    getStatusCode(uri: string, method: string): Promise<number>
}

export default class Net implements Net {
    static axios :AxiosStatic = axios
    /**
     * 发起请求
     * @param {string} uri URL 地址
     * @param {string} method 请求方法
     * @param {object} qs QueryString
     * @param {object} data FormData
     * @param {object} headers headers
     * @returns {Promise<AxiosResponse>}
     */
    static request (uri: string, method: string, qs?: object, data?: object, headers?: object): Promise<AxiosResponse> {
        const baseHeader = {
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; WOW64; rv:56.0) Gecko/20100101 Firefox/56.0`,
            'Referer': '',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'X-Requested-With': 'Hitokoto Status Minixs Bot'
        }
        if (headers) {
            Object.assign(baseHeader, headers)
        }
        return this.axios.request({
            url: uri,
            method: method,
            headers: baseHeader,
            params: qs ? qs : {},
            data: data ? data: {},
            responseType: 'arraybuffer'
        })
    }
    static async getStatusCode (uri: string, method: string = 'GET'): Promise<number> {
        const responseBody = await this.request(uri, method)
        return responseBody.status
    }

    static async getJSON(uri: string, method: string = 'GET', qs?: object, data?: object, headers?: object): Promise<AxiosResponse | statusBody> {
        const responseBody = await this.request(uri, method)
        if (responseBody.status !== 200) {
            return responseBody
        }
        return JSON.parse(responseBody.data.toString())
    }
}
