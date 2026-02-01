import request from '@/plugins/request';

export function PetList (params) {
    return request({
        url: '/api/pets',
        method: 'get',
        params
    });
}

export function PetDetail (id) {
    return request({
        url: `/api/pets/${id}`,
        method: 'get'
    });
}

export function PetCreate (data) {
    return request({
        url: '/api/pets',
        method: 'post',
        data
    });
}

export function PetUpdate (id, data) {
    return request({
        url: `/api/pets/${id}`,
        method: 'put',
        data
    });
}

export function PetDelete (id) {
    return request({
        url: `/api/pets/${id}`,
        method: 'delete'
    });
}
