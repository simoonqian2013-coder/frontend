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
