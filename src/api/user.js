import request from '@/plugins/request';

export function UserList () {
    return request({
        url: '/api/users',
        method: 'get'
    });
}

export function UserCreate (data) {
    return request({
        url: '/api/users',
        method: 'post',
        data
    });
}

export function UserUpdate (id, data) {
    return request({
        url: `/api/users/${id}`,
        method: 'put',
        data
    });
}

export function UserDelete (id) {
    return request({
        url: `/api/users/${id}`,
        method: 'delete'
    });
}

export function UserAssignRoles (data) {
    return request({
        url: '/api/users/assign-roles',
        method: 'post',
        data
    });
}

export function UserRoleIds (id) {
    return request({
        url: `/api/users/${id}/roles`,
        method: 'get'
    });
}
