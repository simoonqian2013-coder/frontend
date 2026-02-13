import request from '@/plugins/request';

export function DashboardSummary () {
    return request({
        url: '/api/dashboard/summary',
        method: 'get'
    });
}
