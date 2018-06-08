// 注册依赖
import nconf from 'nconf'
import winston from 'winston'
import fs from 'fs'
import path from 'path'
import _ from 'lodash'

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
async function fetchServerList() {
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
async function fetch(list: Array<any>): Promise<Array<statusBody | networkError>> {
    async function fetchChild(input: any) {
        console.log(input)
        try {
            const responseBody = await net.getJSON(input.url + '/status')
            if ((<AxiosResponse>responseBody).status) {
                const errorMsg: networkError = {
                    isError: true,
                    id: input.id,
                    code: (<AxiosResponse>responseBody).status,
                    msg: (<AxiosResponse>responseBody).statusText,
                    stack: new Error().stack || '',
                    ts: Date.now()
                }
                return errorMsg
            } else {
                return <statusBody>responseBody
            }
        } catch (err) {
            // 网络错误 或者其他错误
            const errorMsg: networkError = {
                isError: true,
                id: input.id,
                code: -1, // 非网络错误
                msg: err.message,
                stack: err.stack,
                ts: Date.now()
            }
            return errorMsg
        }
    }
    const events: Array<Promise<statusBody | networkError>> = []
    for (let value of list) {
        // 进行纯异步请求
        events.push(fetchChild(value))
    }
    return Promise.all(events) // 并发一波请求
}

import { applyMinxin, statusBody, networkError, downServerList } from './src/utils'
import { start } from 'repl';
let childList = {
    lastUpdate: 0,
    list: []
}
let downServerList: downServerList = fs.existsSync('./data/down.json') ? JSON.parse(fs.readFileSync('./data/down.json').toString()) : {
    ids: [],
    data: []
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
    const fetchResult = await fetch(list)
    const children: Array<statusBody> = []
    const downServer: Array<networkError> = []
    for (let child of fetchResult) {
        if ((<networkError>child).isError) {
            downServer.push(<networkError>child)
        } else {
            children.push((child as statusBody))
        }
    }
    // 迭代添加宕机时间
    let toRemoveIds = []
    if (downServer.length > 0) {
        for (let child of downServer) {
            toRemoveIds.push(child.id)
            // 检测是否在目前的数据已经存在于宕机数组
            if (_.indexOf(downServerList.ids, child.id)) {
                // 已经存在于宕机数组
                // 更新一下里面的部分信息
                for (let solo of downServerList.data) {
                    if (solo.id === child.id) {
                        solo.statusMsg = child
                    }
                }
            } else {
                // 并不存在， 我们添加进去
                downServerList.ids.push(child.id)
                downServerList.data.push({
                    id: child.id,
                    start: Date.now(),
                    statusMsg: child
                })
            }
        }
    }

    // 移除已经失效的宕机数据
    if (downServerList.data.length > 0) {
        toRemoveIds = _.pullAll(_.pullAll(downServerList.ids, toRemoveIds))
        let toRemoveData = []
        for (let child of downServerList.data) {
            for (let id in toRemoveIds) {
                if (id === child.id) {
                    toRemoveData.push(child)
                }
            }
        }
        _.pullAll(downServerList.ids, toRemoveIds)
        _.pullAll(downServerList.data, toRemoveData)
    }

    winston.info('执行数据合并...')
    console.log(children)
    const data = await applyMinxin(children, downServerList)
    fs.existsSync(path.join('./data')) || fs.mkdirSync(path.join('./data'))
    winston.info('写入状态数据...')
    fs.writeFileSync(path.join('./data/status.json'), JSON.stringify(data))
    fs.writeFileSync(path.join('./data/down.json'), JSON.stringify(downServerList))
}

function autoRestartSave() {
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
        autoRestartSave()
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
import { AxiosResponse } from 'axios'

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
    .use(koa_cors())
    .use(router.routes())
    .use(router.allowedMethods())
    .use(koa_bodypaser())
    .use(koa_json())
    .use(koa_json_error())
const port = nconf.get('port') || 6578
app.listen(port)
winston.info('Server is started. Listening on Port: ' + port)
