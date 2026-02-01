const pre = '/pets/';

export default {
    path: '/pets',
    title: '宠物',
    header: 'home',
    icon: 'md-paw',
    children: [
        {
            path: `${pre}list`,
            title: '宠物列表'
        }
    ]
};
