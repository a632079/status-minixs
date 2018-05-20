// 预启动
import nconf from 'nconf'
import path from 'path'
import winston from 'winston'
import colors from 'colors/safe'
import fs from 'fs'

const pkg = fs.existsSync('./package.json') ? JSON.parse(fs.readFileSync('./package.json').toString()) : {}

export interface preStart {
    printCopyright(): void
    initWinston(logFile: string, configFile: string): void
    registerNconf(configFile: string): void
    load(params?: loadParams): void
}

export interface loadParams {
    configFile?: string,
    logFile?: string
}

export class preStart implements preStart {

    static registerNconf(configFile: string) {
        winston.verbose('* using configuration stored in: %s', configFile)
        nconf.file({
            file: configFile
        })
        nconf.defaults({
            base_dir: '../',
            version: pkg.version
        })

        if (!nconf.get('isCluster')) {
            nconf.set('isPrimary', 'true')
            nconf.set('isCluster', 'false')
        }
    }

    static initWinston(logFile: string, configFile: string) {
        // 获取 config
        const config = fs.existsSync(configFile) ? JSON.parse(fs.readFileSync(configFile).toString()) : {}
        // 初始化 winston
        fs.existsSync(logFile) || fs.writeFileSync(logFile, '')
        winston.remove(winston.transports.Console)
        winston.add(winston.transports.File, {
            filename: logFile,
            level: nconf.get('log_level') || 'verbose',
            handleExceptions: true,
            maxsize: 5242880,
            maxFiles: 10
        })
        winston.add(winston.transports.Console, {
            colorize: nconf.get('log-colorize') !== 'false',
            timestamp: function () {
                var date = new Date()
                return config.json_logging ? date.toJSON()
                    : date.toISOString() + ' [' + global.process.pid + ']'
            },
            level: config.log_level || 'verbose',
            json: !!config.json_logging,
            stringify: !!config.json_logging
        })
    }

    static printCopyright() {
        const date = new Date()
        console.log(colors.bgBlue(colors.black(' ' + pkg.name + ' v' + pkg.version + ' © ' + date.getFullYear() + ' All Rights Reserved. ')) + '   ' + colors.bgRed(colors.black(' Powered by teng-koa ')))
        console.log('')
        console.log(colors.bgCyan(colors.black(' 我们一路奋战，不是为了改变世界，而是为了不让世界改变我们。 ')))
    }

    static load(config? :loadParams) {
        const configFile = config && config.configFile ? config.configFile : './config.json'
        const logFile = config && config.logFile ? config.logFile : './data/data.log'

        // preStart
        this.printCopyright()
        this.initWinston(logFile, configFile)
        this.registerNconf(configFile)
    }
}