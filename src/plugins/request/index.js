import store from '@/store';
import axios from 'axios';
import util from '@/libs/util';
import Setting from '@/setting';

import { Message, Notice } from 'view-design';

// 创建一个错�?
function errorCreate (msg) {
    const err = new Error(msg);
    errorLog(err);
    throw err;
}

// 记录和显示错�?
function errorLog (err) {
    // 添加到日�?
    store.dispatch('admin/log/push', {
        message: '数据请求异常',
        type: 'error',
        meta: {
            error: err
        }
    });
    // 打印到控制台
    if (process.env.NODE_ENV === 'development') {
        util.log.error('>>>>>> Error >>>>>>');
        console.log(err);
    }
    // 显示提示，可配置使用 iView �?$Message 还是 $Notice 组件来显�?
    if (Setting.errorModalType === 'Message') {
        Message.error({
            content: err.message,
            duration: Setting.modalDuration
        });
    } else if (Setting.errorModalType === 'Notice') {
        Notice.error({
            title: '提示',
            desc: err.message,
            duration: Setting.modalDuration
        });
    }
}

// 创建一�?axios 实例
const service = axios.create({
    baseURL: Setting.apiBaseURL,
    timeout: 5000 // 请求超时时间
});

// 请求拦截�?
service.interceptors.request.use(
    config => {
        // 在请求发送之前做一些处�?
        const token = util.cookies.get('token');
        if (token) {
        config.headers.Authorization = 'Bearer ' + token;
        }
        return config;
    },
    error => {
        // 发送失�?
        console.log(error);
        Promise.reject(error);
    }
);

service.interceptors.response.use(
    response => {
        const dataAxios = response.data;
        const { code } = dataAxios;
        // 根据 code 进行判断
        if (code === undefined) {
            // 如果没有 code 代表这不是项目后端开发的接口
            return dataAxios;
        } else {
            switch (code) {
            case 0:
                // [ 示例 ] code === 0 代表没有错误
                return dataAxios.data;
            case 'xxx':
                // [ 示例 ] 其它和后台约定的 code
                errorCreate(`[ code: xxx ] ${dataAxios.msg}: ${response.config.url}`);
                break;
            default:
                // 不是正确�?code
                errorCreate(`${dataAxios.msg}: ${response.config.url}`);
                break;
            }
        }
    },
    error => {
        if (error && error.response) {
            switch (error.response.status) {
            case 400: error.message = '请求错误'; break;
            case 401: error.message = '未授权，'; break;
            case 403: error.message = '拒绝访问'; break;
            case 404: error.message = `请求地址出错: ${error.response.config.url}`; break;
            case 408: error.message = '请求超时'; break;
            case 500: error.message = '服务器内部错'; break;
            case 501: error.message = '服务未实'; break;
            case 502: error.message = '网关错误'; break;
            case 503: error.message = '服务不'; break;
            case 504: error.message = '网关超时'; break;
            case 505: error.message = 'HTTP版本不受支持'; break;
            default: break;
            }
        }
        errorLog(error);
        return Promise.reject(error);
    }
);

export default service;



