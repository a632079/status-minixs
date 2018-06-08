"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const semver_compare_1 = __importDefault(require("semver-compare"));
function applyMinxin(children, downServerList) {
    return __awaiter(this, void 0, void 0, function* () {
        // 首先初始化返回类
        const result = {
            version: '0.0.0',
            children: [],
            downServer: [],
            status: {
                load: [0, 0, 0],
                memory: 0,
                hitokoto: {
                    total: 0,
                    categroy: []
                },
                childStatus: []
            },
            requests: {
                all: {
                    total: 0,
                    pastMinute: 0,
                    pastHour: 0,
                    pastDay: 0,
                    dayMap: [],
                    FiveMinuteMap: []
                },
                hosts: {
                    'v1.hitokoto.cn': {
                        total: 0,
                        pastMinute: 0,
                        pastHour: 0,
                        pastDay: 0,
                        dayMap: []
                    },
                    'api.hitokoto.cn': {
                        total: 0,
                        pastMinute: 0,
                        pastHour: 0,
                        pastDay: 0,
                        dayMap: []
                    },
                    'sslapi.hitokoto.cn': {
                        total: 0,
                        pastMinute: 0,
                        pastHour: 0,
                        pastDay: 0,
                        dayMap: []
                    }
                },
            },
            lastUpdate: 0,
            now: '',
            ts: 0
        };
        // 注册一波缓存， 最蠢的数据合并方法
        const loadBuffer = [0, 0, 0];
        let allDayMapBuffer = [];
        let allFiveMinuteBuffer = [];
        let v1DayMapBuffer = [];
        let apiDayMapBuffer = [];
        let sslapiDayMapBuffer = [];
        // 迭代数据集， 合并数据
        for (let child of children) {
            // 汇总子节点名称
            result.children.push(child.server_id);
            // 版本号
            result.version = semver_compare_1.default(result.version, child.version) < 0 ? child.version : result.version;
            // 缓存 status 统计, 以便结束迭代时计算平均值
            loadBuffer[0] += child.server_status.load[0];
            loadBuffer[1] += child.server_status.load[1];
            loadBuffer[2] += child.server_status.load[2];
            // 汇总总使用内存
            result.status.memory += child.server_status.memory.usage;
            // 一言总数统计汇总
            result.status.hitokoto.total = result.status.hitokoto.total < child.server_status.hitokto.total ? child.server_status.hitokto.total : result.status.hitokoto.total;
            result.status.hitokoto.categroy = result.status.hitokoto.categroy.length < child.server_status.hitokto.categroy.length ? child.server_status.hitokto.categroy : result.status.hitokoto.categroy;
            // 推送子状态
            const childStatus = {
                id: child.server_id
            };
            result.status.childStatus.push(Object.assign(childStatus, child.server_status));
            // 合并 all 统计
            result.requests.all.total += child.requests.all.total; // 合并总请求数
            result.requests.all.pastMinute += child.requests.all.pastMinute; // 合并每分钟请求数
            result.requests.all.pastHour += child.requests.all.pastHour; // 合并每小时请求数
            result.requests.all.pastDay += child.requests.all.pastDay; // 合并每日请求数
            if (allDayMapBuffer.length === 0) { // 汇总 DayMap 统计
                // 缓存为空
                allDayMapBuffer = child.requests.all.dayMap;
            }
            else {
                // 缓存存在值
                for (let index in child.requests.all.dayMap) {
                    allDayMapBuffer[index] += child.requests.all.dayMap[index];
                }
            }
            if (allFiveMinuteBuffer.length === 0) { // 汇总 FiveMinuteMap 统计
                // 缓存为空
                allFiveMinuteBuffer = child.requests.all.FiveMinuteMap;
            }
            else {
                // 缓存存在值
                for (let index in child.requests.all.FiveMinuteMap) {
                    allFiveMinuteBuffer[index] += child.requests.all.FiveMinuteMap[index];
                }
            }
            // 汇总 hosts 统计
            result.requests.hosts['v1.hitokoto.cn'].total += child.requests.hosts['v1.hitokoto.cn'].total;
            result.requests.hosts['v1.hitokoto.cn'].pastMinute += child.requests.hosts['v1.hitokoto.cn'].pastMinute;
            result.requests.hosts['v1.hitokoto.cn'].pastHour += child.requests.hosts['v1.hitokoto.cn'].pastHour;
            result.requests.hosts['v1.hitokoto.cn'].pastDay += child.requests.hosts['v1.hitokoto.cn'].pastDay;
            if (v1DayMapBuffer.length === 0) { // 汇总 FiveMinuteMap 统计
                // 缓存为空
                v1DayMapBuffer = child.requests.hosts['v1.hitokoto.cn'].dayMap;
            }
            else {
                // 汇总
                for (let index in child.requests.hosts['v1.hitokoto.cn'].dayMap) {
                    v1DayMapBuffer[index] += child.requests.hosts['v1.hitokoto.cn'].dayMap[index];
                }
            }
            if (typeof child.requests.hosts['api.hitokoto.cn'] !== 'undefined') {
                result.requests.hosts['api.hitokoto.cn'].total += child.requests.hosts['api.hitokoto.cn'].total;
                result.requests.hosts['api.hitokoto.cn'].pastMinute += child.requests.hosts['api.hitokoto.cn'].pastMinute;
                result.requests.hosts['api.hitokoto.cn'].pastHour += child.requests.hosts['api.hitokoto.cn'].pastHour;
                result.requests.hosts['api.hitokoto.cn'].pastDay += child.requests.hosts['api.hitokoto.cn'].pastDay;
                if (apiDayMapBuffer.length === 0) { // 汇总 FiveMinuteMap 统计
                    // 缓存为空
                    apiDayMapBuffer = child.requests.hosts['api.hitokoto.cn'].dayMap;
                }
                else {
                    // 汇总
                    for (let index in child.requests.hosts['api.hitokoto.cn'].dayMap) {
                        apiDayMapBuffer[index] += child.requests.hosts['api.hitokoto.cn'].dayMap[index];
                    }
                }
            }
            if (typeof child.requests.hosts['sslapi.hitokoto.cn'] !== 'undefined') {
                result.requests.hosts['sslapi.hitokoto.cn'].total += child.requests.hosts['sslapi.hitokoto.cn'].total;
                result.requests.hosts['sslapi.hitokoto.cn'].pastMinute += child.requests.hosts['sslapi.hitokoto.cn'].pastMinute;
                result.requests.hosts['sslapi.hitokoto.cn'].pastHour += child.requests.hosts['sslapi.hitokoto.cn'].pastHour;
                result.requests.hosts['sslapi.hitokoto.cn'].pastDay += child.requests.hosts['sslapi.hitokoto.cn'].pastDay;
                if (sslapiDayMapBuffer.length === 0) { // 汇总 FiveMinuteMap 统计
                    // 缓存为空
                    sslapiDayMapBuffer = child.requests.hosts['sslapi.hitokoto.cn'].dayMap;
                }
                else {
                    // 汇总
                    for (let index in child.requests.hosts['sslapi.hitokoto.cn'].dayMap) {
                        sslapiDayMapBuffer[index] += child.requests.hosts['sslapi.hitokoto.cn'].dayMap[index];
                    }
                }
            }
        }
        // 计算 load 平均值
        for (let index in loadBuffer) {
            result.status.load[index] = loadBuffer[index] / result.children.length;
        }
        // 合并 Map
        result.requests.all.dayMap = allDayMapBuffer;
        result.requests.all.FiveMinuteMap = allFiveMinuteBuffer;
        result.requests.hosts['v1.hitokoto.cn'].dayMap = v1DayMapBuffer;
        result.requests.hosts['api.hitokoto.cn'].dayMap = apiDayMapBuffer;
        result.requests.hosts['sslapi.hitokoto.cn'].dayMap = sslapiDayMapBuffer;
        // 合并 宕机服务
        for (let child of downServerList.data) {
            result.children.push(child.id);
            result.downServer.push({
                id: child.id,
                startTs: child.start,
                last: Date.now() - child.start,
                statusMessage: child.statusMsg
            });
        }
        // 写入值
        const ts = Date.now();
        const date = new Date(ts);
        result.lastUpdate = ts;
        result.now = date.toLocaleString();
        result.ts = ts;
        return result;
    });
}
exports.applyMinxin = applyMinxin;
//# sourceMappingURL=utils.js.map