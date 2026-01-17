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
        }
    ]
}
