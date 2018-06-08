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
// 注册依赖
const nconf_1 = __importDefault(require("nconf"));
const winston_1 = __importDefault(require("winston"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
// 使用蓝鸟加速
const bluebird_1 = __importDefault(require("bluebird"));
global.Promise = bluebird_1.default;
// 注册初始化环境
const preStart_1 = require("./src/preStart");
preStart_1.preStart.load();
// 注册网络库
const net_1 = __importDefault(require("./src/net"));
// 注册加密库
const crypto_1 = __importDefault(require("./src/crypto"));
// CronJob
const cron_1 = require("cron");
// 获取子节点列表
function fetchServerList() {
    return __awaiter(this, void 0, void 0, function* () {
        winston_1.default.info('开始获取节点列表...');
        const tagetUri = nconf_1.default.get('target_uri');
        const decryptKey = nconf_1.default.get('decrypt_key');
        const decrypt_iv = nconf_1.default.get('decrypt_iv');
        winston_1.default.verbose(tagetUri);
        winston_1.default.verbose(decryptKey);
        // 请求接口， 获取列表
        const responseBody = yield net_1.default.request(tagetUri + '?ts=' + Date.now(), 'GET');
        // console.log(responseBody)
        const data = responseBody.data.toString('utf8');
        winston_1.default.verbose(data);
        const list = JSON.parse(crypto_1.default.aesDecrypt(data, decryptKey, decrypt_iv));
        winston_1.default.verbose(list);
        return list;
    });
}
// 获取数据
function fetch(list) {
    return __awaiter(this, void 0, void 0, function* () {
        function fetchChild(input) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    const responseBody = yield net_1.default.getJSON(input.url + '/status');
                    if (responseBody) {
                        const errorMsg = {
                            isError: true,
                            id: input.id,
                            code: responseBody.status,
                            msg: responseBody.statusText,
                            stack: new Error().stack || '',
                            ts: Date.now()
                        };
                        return errorMsg;
                    }
                    else {
                        return responseBody;
                    }
                }
                catch (err) {
                    // 网络错误 或者其他错误
                    const errorMsg = {
                        isError: true,
                        id: input.id,
                        code: -1,
                        msg: err.message,
                        stack: err.stack,
                        ts: Date.now()
                    };
                    return errorMsg;
                }
            });
        }
        const events = [];
        for (let value of list) {
            // 进行纯异步请求
            events.push(fetchChild(value));
        }
        return Promise.all(events); // 并发一波请求
    });
}
const utils_1 = require("./src/utils");
let childList = {
    lastUpdate: 0,
    list: []
};
let downServerList = JSON.parse(fs_1.default.readFileSync('./data/status.json').toString()) || {
    ids: [],
    data: []
};
function saveStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!childList.lastUpdate) {
            childList.list = yield fetchServerList();
            childList.lastUpdate = Date.now();
        }
        else if ((Date.now() - childList.lastUpdate) > 60 * 60 * 2) {
            fetchServerList()
                .then(list => {
                childList.list = list;
                childList.lastUpdate = Date.now();
            });
        }
        const list = childList.list;
        winston_1.default.info('开始获取子节点数据...');
        const fetchResult = yield fetch(list);
        const children = [];
        const downServer = [];
        for (let child of fetchResult) {
            if (child) {
                downServer.push(child);
            }
            else {
                children.push(child);
            }
        }
        // 迭代添加宕机时间
        let toRemoveIds = [];
        for (let child of downServer) {
            toRemoveIds.push(child.id);
            // 检测是否在目前的数据已经存在于宕机数组
            if (lodash_1.default.indexOf(downServerList.ids, child.id)) {
                // 已经存在于宕机数组
                // 更新一下里面的部分信息
                for (let solo of downServerList.data) {
                    if (solo.id === child.id) {
                        solo.statusMsg = child;
                    }
                }
            }
            else {
                // 并不存在， 我们添加进去
                downServerList.ids.push(child.id);
                downServerList.data.push({
                    id: child.id,
                    start: Date.now(),
                    statusMsg: child
                });
            }
        }
        // 移除已经失效的宕机数据
        toRemoveIds = lodash_1.default.pullAll(lodash_1.default.pullAll(downServerList.ids, toRemoveIds));
        let toRemoveData = [];
        for (let child of downServerList.data) {
            for (let id in toRemoveIds) {
                if (id === child.id) {
                    toRemoveData.push(child);
                }
            }
        }
        lodash_1.default.pullAll(downServerList.ids, toRemoveIds);
        lodash_1.default.pullAll(downServerList.data, toRemoveData);
        winston_1.default.info('执行数据合并...');
        const data = yield utils_1.applyMinxin(children, downServerList);
        fs_1.default.existsSync(path_1.default.join('./data')) || fs_1.default.mkdirSync(path_1.default.join('./data'));
        winston_1.default.info('写入状态数据...');
        fs_1.default.writeFileSync(path_1.default.join('./data/status.json'), JSON.stringify(data));
        fs_1.default.writeFileSync(path_1.default.join('./data/down.json'), JSON.stringify(downServerList));
    });
}
function autoRestartSave() {
    saveStatus()
        .catch(e => {
        winston_1.default.error(e);
        winston_1.default.info('自动重新尝试获取..');
        autoRestartSave();
    });
}
const job = new cron_1.CronJob('*/10 * * * * *', () => {
    autoRestartSave();
}, () => {
    job.start();
}, true, 'Asia/Shanghai');
const koa_1 = __importDefault(require("koa"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_json_1 = __importDefault(require("koa-json"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_json_error_1 = __importDefault(require("koa-json-error"));
const cors_1 = __importDefault(require("@koa/cors"));
const app = new koa_1.default();
const router = new koa_router_1.default();
router
    .get('/', (ctx) => __awaiter(this, void 0, void 0, function* () {
    const file = JSON.parse(fs_1.default.readFileSync('./data/status.json').toString());
    const now = Date.now();
    Object.assign(file, {
        ts: now,
        now: new Date(now).toString()
    });
    ctx.body = file;
}));
// 注册中间件
app
    .use(cors_1.default())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(koa_bodyparser_1.default())
    .use(koa_json_1.default())
    .use(koa_json_error_1.default());
const port = nconf_1.default.get('port') || 6578;
app.listen(port);
winston_1.default.info('Server is started. Listening on Port: ' + port);
//# sourceMappingURL=core.js.map