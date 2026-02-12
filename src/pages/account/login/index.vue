<template>
    <div class="page-account page-account--cute">
        <div v-if="showI18n" class="page-account-header">
            <i-header-i18n />
        </div>
        <div class="page-account-card">
            <div class="page-account-hero">
                <div class="hero-mascot">
                    <img src="@/assets/images/login-mascot.png" alt="宠物之家" />
                </div>
                <div class="hero-title">欢迎来到宠物领养救助之家</div>
                <div class="hero-subtitle">您的关爱，我们的使命</div>
            </div>
            <div class="page-account-form">
                <div class="form-title">宠物领养救助之家</div>
                <div class="form-subtitle">PET HOME</div>
                <div class="form-welcome">欢迎回来！</div>
                <Login @on-submit="handleSubmit">
                    <UserName name="username" value="admin" />
                    <Password name="password" value="admin" enter-to-submit />
                    <div class="page-account-auto-login">
                        <Checkbox v-model="autoLogin" size="large">{{ $t('page.login.remember') }}</Checkbox>
                        <a href="">{{ $t('page.login.forgot') }}</a>
                    </div>
                    <Submit>{{ $t('page.login.submit') }}</Submit>
                </Login>
                <div class="page-account-other">
                    <router-link class="page-account-register" :to="{ name: 'register' }">立即注册</router-link>
                </div>
            </div>
        </div>
        <i-copyright />
    </div>
</template>
<script>
    import iCopyright from '@/components/copyright';
    import { mapActions } from 'vuex';
    import mixins from '../mixins';

    export default {
        mixins: [ mixins ],
        components: { iCopyright },
        data () {
            return {
                autoLogin: true
            }
        },
        methods: {
            ...mapActions('admin/account', [
                'login'
            ]),
            /**
             * @description 登录
             * 表单校验已有 iView Pro 自动完成，如有需要修改，请阅读 iView Pro 文档
             */
            handleSubmit (valid, values) {
                if (valid) {
                    const { username, password } = values;
                    this.login({
                        username,
                        password
                    })
                        .then(() => {
                            // 重定向对象不存在则返回顶层路径
                            this.$router.replace(this.$route.query.redirect || '/');
                    });
                }
            }
        }
    };
</script>
