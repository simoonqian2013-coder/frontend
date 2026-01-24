import request from '@/plugins/request';

export function PermissionList () {
    return request({
        url: '/api/permissions',
        method: 'get'
    });
}
