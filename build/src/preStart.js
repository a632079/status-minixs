"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// 预启动
const nconf_1 = __importDefault(require("nconf"));
const winston_1 = __importDefault(require("winston"));
const safe_1 = __importDefault(require("colors/safe"));
const fs_1 = __importDefault(require("fs"));
const pkg = fs_1.default.existsSync('./package.json') ? JSON.parse(fs_1.default.readFileSync('./package.json').toString()) : {};
class preStart {
    static registerNconf(configFile) {
        winston_1.default.verbose('* using configuration stored in: %s', configFile);
        nconf_1.default.file({
            file: configFile
        });
        nconf_1.default.defaults({
            base_dir: '../',
            version: pkg.version
        });
        if (!nconf_1.default.get('isCluster')) {
            nconf_1.default.set('isPrimary', 'true');
            nconf_1.default.set('isCluster', 'false');
        }
    }
    static initWinston(logFile, configFile) {
        // 获取 config
        const config = fs_1.default.existsSync(configFile) ? JSON.parse(fs_1.default.readFileSync(configFile).toString()) : {};
        // 初始化 winston
        fs_1.default.existsSync(logFile) || fs_1.default.writeFileSync(logFile, '');
        winston_1.default.remove(winston_1.default.transports.Console);
        winston_1.default.add(winston_1.default.transports.File, {
            filename: logFile,
            level: nconf_1.default.get('log_level') || 'verbose',
            handleExceptions: true,
            maxsize: 5242880,
            maxFiles: 10
        });
        winston_1.default.add(winston_1.default.transports.Console, {
            colorize: nconf_1.default.get('log-colorize') !== 'false',
            timestamp: function () {
                var date = new Date();
                return config.json_logging ? date.toJSON()
                    : date.toISOString() + ' [' + global.process.pid + ']';
            },
            level: config.log_level || 'verbose',
            json: !!config.json_logging,
            stringify: !!config.json_logging
        });
    }
    static printCopyright() {
        const date = new Date();
        console.log(safe_1.default.bgBlue(safe_1.default.black(' ' + pkg.name + ' v' + pkg.version + ' © ' + date.getFullYear() + ' All Rights Reserved. ')) + '   ' + safe_1.default.bgRed(safe_1.default.black(' Powered by teng-koa ')));
        console.log('');
        console.log(safe_1.default.bgCyan(safe_1.default.black(' 我们一路奋战，不是为了改变世界，而是为了不让世界改变我们。 ')));
    }
    static load(config) {
        const configFile = config && config.configFile ? config.configFile : './config.json';
        const logFile = config && config.logFile ? config.logFile : './data/data.log';
        // preStart
        this.printCopyright();
        this.initWinston(logFile, configFile);
        this.registerNconf(configFile);
    }
}
exports.preStart = preStart;
//# sourceMappingURL=preStart.js.map