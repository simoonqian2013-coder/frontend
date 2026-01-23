const pre = '/setting/';

export default {
    path: '/setting',
    title: 'Settings',
    header: 'home',
    icon: 'md-settings',
    children: [
        {
            path: `${pre}role`,
            title: '角色'
        },
        {
            path: `${pre}user`,
            title: '用户'
        },
        {
            path: `${pre}menu`,
            title: '菜单管理'
        }
    ]
}
