import { AxiosStatic, AxiosResponse } from 'axios';
import { statusBody } from './utils';
export default interface Net {
    axios: AxiosStatic;
    request(uri: string, method: string, qs?: object, data?: object, headers?: object): Promise<AxiosResponse>;
    getStatusCode(uri: string, method: string): Promise<number>;
}
export default class Net implements Net {
    static axios: AxiosStatic;
    /**
     * 发起请求
     * @param {string} uri URL 地址
     * @param {string} method 请求方法
     * @param {object} qs QueryString
     * @param {object} data FormData
     * @param {object} headers headers
     * @returns {Promise<AxiosResponse>}
     */
    static request(uri: string, method: string, qs?: object, data?: object, headers?: object): Promise<AxiosResponse>;
    static getStatusCode(uri: string, method?: string): Promise<number>;
    static getJSON(uri: string, method?: string, qs?: object, data?: object, headers?: object): Promise<AxiosResponse | statusBody>;
}
