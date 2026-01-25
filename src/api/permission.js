import request from '@/plugins/request';

export function PermissionList () {
    return request({
        url: '/api/permissions',
        method: 'get'
    });
}

export function PermissionTree () {
    return request({
        url: '/api/permissions/tree',
        method: 'get'
    });
}

export function PermissionCreate (data) {
    return request({
        url: '/api/permissions',
        method: 'post',
        data
    });
}

export function PermissionUpdate (id, data) {
    return request({
        url: `/api/permissions/${id}`,
        method: 'put',
        data
    });
}

export function PermissionDelete (id) {
    return request({
        url: `/api/permissions/${id}`,
        method: 'delete'
    });
}
