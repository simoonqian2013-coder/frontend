import request from '@/plugins/request';

export function MenuList () {
    return request({
        url: '/api/menus',
        method: 'get'
    });
}

export function MenuCurrent () {
    return request({
        url: '/api/menus/current',
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

export function MenuRoleIds (id) {
    return request({
        url: `/api/menus/${id}/roles`,
        method: 'get'
    });
}

export function MenuPermissionIds (id) {
    return request({
        url: `/api/menus/${id}/permissions`,
        method: 'get'
    });
}

export function MenuPermissionDetails (id) {
    return request({
        url: `/api/menus/${id}/permissions/details`,
        method: 'get'
    });
}

export function MenuAssignRoles (data) {
    return request({
        url: '/api/menus/assign-roles',
        method: 'post',
        data
    });
}

export function MenuAssignPermissions (data) {
    return request({
        url: '/api/menus/assign-permissions',
        method: 'post',
        data
    });
}
