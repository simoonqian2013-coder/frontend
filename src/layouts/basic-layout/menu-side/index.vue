<template>
    <div>
        <div class="i-layout-sider-logo" :class="{ 'i-layout-sider-logo-dark': siderTheme === 'dark' }">
            <transition name="fade-quick">
                <i-link to="/" v-show="!hideLogo">
                    <div class="i-layout-sider-logo-inner" :class="{ 'is-collapse': menuCollapse }">
                        <img src="@/assets/images/favicon.png" alt="宠物领养救助之家">
                        <span v-if="!menuCollapse" class="i-layout-sider-logo-text">宠物领养救助之家</span>
                    </div>
                </i-link>
            </transition>
        </div>
        <Menu
                ref="menu"
                class="i-layout-menu-side i-scrollbar-hide"
                :theme="siderTheme"
                :accordion="menuAccordion"
                :active-name="activePath"
                :open-names="openNames"
                width="auto">
            <template v-if="!menuCollapse" v-for="(item, index) in filterSider">
                <i-menu-side-item v-if="item.children === undefined || !item.children.length" :menu="item" :key="index" />
                <i-menu-side-submenu v-else :menu="item" :key="index" />
            </template>
            <template v-else>
                <Tooltip :content="tTitle(item.title)" placement="right" v-if="item.children === undefined || !item.children.length" :key="index">
                    <i-menu-side-item :menu="item" hide-title />
                </Tooltip>
                <i-menu-side-collapse v-else :menu="item" :key="index" top-level />
            </template>
        </Menu>
    </div>
</template>
<script>
    import iMenuSideItem from './menu-item';
    import iMenuSideSubmenu from './submenu';
    import iMenuSideCollapse from './menu-collapse';
    import tTitle from '../mixins/translate-title';

    import { mapState, mapGetters } from 'vuex';

    export default {
        name: 'iMenuSide',
        mixins: [ tTitle ],
        components: { iMenuSideItem, iMenuSideSubmenu, iMenuSideCollapse },
        props: {
            hideLogo: {
                type: Boolean,
                default: false
            }
        },
        computed: {
            ...mapState('admin/layout', [
                'siderTheme',
                'menuAccordion',
                'menuCollapse'
            ]),
            ...mapState('admin/menu', [
                'activePath',
                'openNames'
            ]),
            ...mapGetters('admin/menu', [
                'filterSider'
            ])
        },
        watch: {
            '$route': {
                handler () {
                    this.handleUpdateMenuState();
                },
                immediate: true
            },
            // 在展开/收起侧边菜单栏时，更新一次 menu 的状态
            menuCollapse () {
                this.handleUpdateMenuState();
            }
        },
        methods: {
            handleUpdateMenuState () {
                this.$nextTick(() => {
                    if (this.$refs.menu) {
                        this.$refs.menu.updateActiveName();
                        if (this.menuAccordion) this.$refs.menu.updateOpened();
                    }
                });
            }
        }
    }
</script>
<style scoped>
    .i-layout-sider-logo-inner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        height: 63px;
        padding: 0 12px;
    }

    .i-layout-sider-logo-inner img {
        height: 34px;
        width: 34px;
        object-fit: contain;
        flex: 0 0 auto;
    }

    .i-layout-sider-logo-inner.is-collapse {
        padding: 0;
    }

    .i-layout-sider-logo-text {
        font-size: 20px;
        font-weight: 600;
        line-height: 1;
        white-space: nowrap;
    }
</style>
