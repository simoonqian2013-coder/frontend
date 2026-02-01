import request from '@/plugins/request';

export function AdoptionList (params) {
    return request({
        url: '/api/adoptions',
        method: 'get',
        params
    });
}

export function AdoptionMyList () {
    return request({
        url: '/api/adoptions/my',
        method: 'get'
    });
}

export function AdoptionDetail (id) {
    return request({
        url: `/api/adoptions/${id}`,
        method: 'get'
    });
}

export function AdoptionCreate (data) {
    return request({
        url: '/api/adoptions',
        method: 'post',
        data
    });
}

export function AdoptionReview (id, data) {
    return request({
        url: `/api/adoptions/${id}/review`,
        method: 'post',
        data
    });
}
