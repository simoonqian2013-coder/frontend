import request from '@/plugins/request';

export function MenuList () {
    return request({
        url: '/api/menus',
        method: 'get'
    });
}

export function MenuCreate (data) {
    return request({
        url: '/api/menus',
        method: 'post',
        data
    });
}

export function MenuUpdate (id, data) {
    return request({
        url: `/api/menus/${id}`,
        method: 'put',
        data
    });
}

export function MenuDelete (id) {
    return request({
        url: `/api/menus/${id}`,
        method: 'delete'
    });
}
