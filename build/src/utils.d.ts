export interface statusBody {
    name: string;
    version: string;
    message: string;
    website: string;
    server_id: string;
    server_status: childServerStatus;
    requests: childRequests;
    feedback: {
        Kuertianshi: string;
        freejishu: string;
        a632079: string;
    };
    copyright: string;
    now: string;
    ts: number;
}
export interface childRequests {
    all: requestsAll;
    hosts: {
        'v1.hitokoto.cn': hostChild;
        'sslapi.hitokoto.cn': hostChild;
        'api.hitokoto.cn': hostChild;
        'api.a632079.me': hostChild;
    };
}
export interface childServerStatus {
    memory: memoryStatus;
    load: Array<number>;
    hitokto: hitokotoStatus;
}
export interface hitokotoStatus {
    total: number;
    categroy: Array<string>;
    lastUpdate?: number;
}
export interface memoryStatus {
    totol: number;
    free: number;
    usage: number;
}
export interface requestsAll {
    total: number;
    pastMinute: number;
    pastHour: number;
    pastDay: number;
    dayMap: Array<number>;
    FiveMinuteMap: Array<number>;
}
export interface hostChild {
    total: number;
    pastMinute: number;
    pastHour: number;
    pastDay: number;
    dayMap: Array<number>;
}
export interface downServerData {
    id: string;
    startTs: number;
    last: number;
    statusMessage: networkError;
}
export interface exportData {
    version: string;
    children: Array<string>;
    downServer: Array<downServerData>;
    status: {
        load: Array<number>;
        memory: number;
        hitokoto: hitokotoStatus;
        childStatus: Array<childServerStatus>;
    };
    requests: {
        all: requestsAll;
        hosts: {
            'v1.hitokoto.cn': hostChild;
            'api.hitokoto.cn': hostChild;
            'sslapi.hitokoto.cn': hostChild;
        };
    };
    lastUpdate: number;
    now: string;
    ts: number;
}
export interface networkError {
    isError: boolean;
    id: string;
    code: number;
    msg: string;
    stack: string;
    ts: number;
}
export interface downServerList {
    ids: Array<string>;
    data: Array<downServer>;
}
export interface downServer {
    id: string;
    start: number;
    statusMsg: networkError;
}
export declare function applyMinxin(children: Array<statusBody>, downServerList: downServerList): Promise<exportData>;
