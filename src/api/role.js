import request from '@/plugins/request';

export function RoleList (params) {
    return request({
        url: '/api/roles',
        method: 'get',
        params
    });
}

export function RoleAll () {
    return request({
        url: '/api/roles/all',
        method: 'get'
    });
}

export function RoleCreate (data) {
    return request({
        url: '/api/roles',
        method: 'post',
        data
    });
}

export function RoleUpdate (id, data) {
    return request({
        url: `/api/roles/${id}`,
        method: 'put',
        data
    });
}

export function RoleDelete (id) {
    return request({
        url: `/api/roles/${id}`,
        method: 'delete'
    });
}

export function RoleAssignPermissions (data) {
    return request({
        url: '/api/roles/assign-permissions',
        method: 'post',
        data
    });
}

export function RolePermissionIds (id) {
    return request({
        url: `/api/roles/${id}/permissions`,
        method: 'get'
    });
}
