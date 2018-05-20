// 注册依赖
import nconf from 'nconf'
import winston from 'winston'
import fs from 'fs'
import path from 'path'
// 使用蓝鸟加速
import bluebird from 'bluebird'
global.Promise = bluebird

// 注册初始化环境
import { preStart } from './src/preStart'
preStart.load()

// 注册网络库
import net from './src/net'

// 注册加密库
import crypto from './src/crypto'

// CronJob
import { CronJob } from 'cron'
// 获取子节点列表
async function fetchServerList () {
    winston.info('开始获取节点列表...')
    const tagetUri = nconf.get('target_uri')
    const decryptKey = nconf.get('decrypt_key')
    const decrypt_iv = nconf.get('decrypt_iv')
    winston.verbose(tagetUri)
    winston.verbose(decryptKey)
    // 请求接口， 获取列表
    const responseBody = await net.request(tagetUri + '?ts=' + Date.now(), 'GET')
    // console.log(responseBody)
    const data = responseBody.data.toString('utf8')
    winston.verbose(data)
    const list = JSON.parse(crypto.aesDecrypt(data, decryptKey, decrypt_iv))
    winston.verbose(list)
    return list
}

// 获取数据
async function fetch(list: Array<string>) {
    const events: Array<Promise<statusBody>> = []
    for (let value of list) {
        events.push(net.getJSON(value + '/status'))
    }
    return Promise.all(events)
}

import { applyMinxin, statusBody } from './src/utils'
import { start } from 'repl';
let childList = {
    lastUpdate: 0,
    list: []
}
async function saveStatus() {
    if (!childList.lastUpdate) {
        childList.list = await fetchServerList()
        childList.lastUpdate = Date.now()
    } else if ((Date.now() - childList.lastUpdate) > 60 * 60 * 2) {
        fetchServerList()
            .then(list => {
                childList.list = list
                childList.lastUpdate = Date.now()
            })
    }
    const list = childList.list
    winston.info('开始获取子节点数据...')
    const children = await fetch(list)
    winston.info('执行数据合并...')
    const data = await applyMinxin(children)
    fs.existsSync(path.join('./data')) || fs.mkdirSync(path.join('./data'))
    winston.info('写入状态数据...')
    fs.writeFileSync(path.join('./data/status.json'), JSON.stringify(data))
}

function autoRestartSave () {
    saveStatus()
        .catch(e => {
            winston.error(e)
            winston.info('自动重新尝试获取..')
            autoRestartSave()
        })
}

const job = new CronJob(
    '*/10 * * * * *',
    () => {
        saveStatus()
    },
    () => {
        job.start()
    },
    true,
    'Asia/Shanghai'
)

import Koa from 'koa'
import Router from 'koa-router'
import koa_json from 'koa-json'
import koa_bodypaser from 'koa-bodyparser'
import koa_json_error from 'koa-json-error'
import koa_cors from '@koa/cors'
import { auto } from 'async';

const app = new Koa()
const router = new Router()

router
    .get('/', async ctx => {
        const file = JSON.parse(fs.readFileSync('./data/status.json').toString())
        const now = Date.now()
        Object.assign(file, {
            ts: now,
            now: new Date(now).toString()
        })
        ctx.body = file
    })

    
// 注册中间件
app
    .use(router.routes())
    .use(router.allowedMethods())
    .use(koa_bodypaser())
    .use(koa_json())
    .use(koa_json_error())
	.use(koa_cors())

const port = nconf.get('port') || 6578
app.listen(port)
winston.info('Server is started. Listening on Port: ' + port)