<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-people" size="16" />
                <span class="ivu-pl-8">用户管理</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="handleAdd">新增用户</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="关键词">
                    <Input v-model="query.keyword" placeholder="用户名/昵称/邮箱/手机号" clearable />
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSearch">查询</Button>
                    <Button class="ivu-ml-8" @click="handleReset">重置</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="green" v-if="row.status === 1">启用</Tag>
                    <Tag color="red" v-else>禁用</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" @click="handleEdit(row)">编辑</Button>
                    <Button size="small" type="error" class="ivu-ml-8" @click="handleDelete(row)">删除</Button>
                    <Button size="small" class="ivu-ml-8" @click="handleAssignRoles(row)">分配角色</Button>
                </template>
            </Table>
            <div class="ivu-mt">
                <Page
                    :total="total"
                    :current="query.page"
                    :page-size="query.size"
                    show-sizer
                    show-total
                    @on-change="handlePageChange"
                    @on-page-size-change="handlePageSizeChange"
                />
            </div>
        </Card>

        <Modal v-model="modalVisible" :title="modalTitle" :mask-closable="false">
            <Form ref="userForm" :model="formModel" :rules="formRules" label-width="90">
                <FormItem label="用户名" prop="username">
                    <Input v-model="formModel.username" :disabled="modalMode === 'edit'" placeholder="登录用户名" />
                </FormItem>
                <FormItem label="密码" prop="password">
                    <Input
                        v-model="formModel.password"
                        type="password"
                        :placeholder="modalMode === 'create' ? '登录密码' : '留空则不修改'"
                    />
                </FormItem>
                <FormItem label="昵称" prop="nickname">
                    <Input v-model="formModel.nickname" placeholder="用户昵称" />
                </FormItem>
                <FormItem label="邮箱" prop="email">
                    <Input v-model="formModel.email" placeholder="邮箱地址" />
                </FormItem>
                <FormItem label="手机号" prop="phone">
                    <Input v-model="formModel.phone" placeholder="手机号码" />
                </FormItem>
                <FormItem label="状态" prop="status">
                    <Select v-model="formModel.status">
                        <Option :value="1">启用</Option>
                        <Option :value="0">禁用</Option>
                    </Select>
                </FormItem>
            </Form>
            <div slot="footer">
                <Button @click="modalVisible = false">取消</Button>
                <Button type="primary" :loading="modalLoading" @click="handleSubmit">保存</Button>
            </div>
        </Modal>

        <Drawer
            title="分配角色"
            v-model="roleDrawerVisible"
            width="420"
            :closable="true"
            :mask-closable="false"
        >
            <div class="ivu-mb">
                <div class="ivu-mb-8">用户：{{ currentUsername }}</div>
                <div class="role-list">
                    <CheckboxGroup v-model="checkedRoleIds">
                        <Checkbox
                            v-for="role in roleOptions"
                            :key="role.id"
                            :label="role.id"
                        >
                            {{ role.name }} ({{ role.code }})
                        </Checkbox>
                    </CheckboxGroup>
                </div>
            </div>
            <div class="drawer-footer">
                <Button @click="roleDrawerVisible = false">取消</Button>
                <Button type="primary" :loading="roleDrawerLoading" class="ivu-ml-8" @click="handleSaveRoles">保存</Button>
            </div>
        </Drawer>
    </div>
</template>

<script>
    import { UserList, UserCreate, UserUpdate, UserDelete, UserAssignRoles, UserRoleIds } from '@api/user';
    import { RoleAll } from '@api/role';
    import { Modal } from 'view-design';

    const defaultForm = () => ({
        id: null,
        username: '',
        password: '',
        nickname: '',
        email: '',
        phone: '',
        status: 1
    });

    export default {
        name: 'user',
        data () {
            return {
                query: {
                    keyword: '',
                    page: 1,
                    size: 10
                },
                loading: false,
                allUsers: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '用户名', key: 'username', minWidth: 120 },
                    { title: '昵称', key: 'nickname', minWidth: 120 },
                    { title: '邮箱', key: 'email', minWidth: 160 },
                    { title: '手机号', key: 'phone', minWidth: 120 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '最近登录', key: 'lastLoginAt', minWidth: 160 },
                    { title: '创建时间', key: 'createdAt', minWidth: 160 },
                    { title: '操作', slot: 'actions', width: 260, align: 'center' }
                ],
                modalVisible: false,
                modalMode: 'create',
                modalLoading: false,
                roleDrawerVisible: false,
                roleDrawerLoading: false,
                roleOptions: [],
                checkedRoleIds: [],
                currentUserId: null,
                currentUsername: '',
                formModel: defaultForm()
            };
        },
        computed: {
            modalTitle () {
                return this.modalMode === 'create' ? '创建用户' : '编辑用户';
            },
            filteredUsers () {
                const keyword = this.query.keyword.trim().toLowerCase();
                if (!keyword) return this.allUsers;
                return this.allUsers.filter(user => {
                    const fields = [
                        user.username,
                        user.nickname,
                        user.email,
                        user.phone
                    ];
                    return fields.some(value => value && value.toLowerCase().includes(keyword));
                });
            },
            total () {
                return this.filteredUsers.length;
            },
            tableData () {
                const start = (this.query.page - 1) * this.query.size;
                return this.filteredUsers.slice(start, start + this.query.size);
            },
            formRules () {
                return {
                    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
                    password: [{ validator: this.validatePassword, trigger: 'blur' }],
                    status: [{ required: true, type: 'number', message: '请选择状态', trigger: 'change' }]
                };
            }
        },
        created () {
            this.fetchUsers();
        },
        methods: {
            validatePassword (rule, value, callback) {
                if (this.modalMode === 'create' && (!value || !value.trim())) {
                    callback(new Error('请输入密码'));
                    return;
                }
                callback();
            },
            fetchUsers () {
                this.loading = true;
                UserList()
                    .then(res => {
                        this.allUsers = Array.isArray(res) ? res : [];
                        this.ensurePageInRange();
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            ensurePageInRange () {
                const totalPages = Math.max(1, Math.ceil(this.total / this.query.size));
                if (this.query.page > totalPages) {
                    this.query.page = totalPages;
                }
            },
            handleSearch () {
                this.query.page = 1;
                this.fetchUsers();
            },
            handleReset () {
                this.query.keyword = '';
                this.query.page = 1;
                this.fetchUsers();
            },
            handlePageChange (page) {
                this.query.page = page;
            },
            handlePageSizeChange (size) {
                this.query.size = size;
                this.query.page = 1;
                this.ensurePageInRange();
            },
            handleAdd () {
                this.modalMode = 'create';
                this.formModel = defaultForm();
                this.modalVisible = true;
            },
            handleEdit (row) {
                this.modalMode = 'edit';
                this.formModel = {
                    id: row.id,
                    username: row.username,
                    password: '',
                    nickname: row.nickname,
                    email: row.email,
                    phone: row.phone,
                    status: row.status
                };
                this.modalVisible = true;
            },
            handleDelete (row) {
                Modal.confirm({
                    title: '确认',
                    content: '确定删除该用户吗？',
                    onOk: () => {
                        UserDelete(row.id).then(() => {
                            this.fetchUsers();
                        });
                    }
                });
            },
            handleAssignRoles (row) {
                this.currentUserId = row.id;
                this.currentUsername = row.username;
                this.roleDrawerVisible = true;
                this.roleDrawerLoading = true;
                Promise.all([RoleAll(), UserRoleIds(row.id)])
                    .then(([roles, selectedIds]) => {
                        this.roleOptions = Array.isArray(roles) ? roles : [];
                        this.checkedRoleIds = Array.isArray(selectedIds) ? selectedIds : [];
                    })
                    .finally(() => {
                        this.roleDrawerLoading = false;
                    });
            },
            handleSaveRoles () {
                if (!this.currentUserId) return;
                this.roleDrawerLoading = true;
                UserAssignRoles({
                    userId: this.currentUserId,
                    roleIds: this.checkedRoleIds
                })
                    .then(() => {
                        this.roleDrawerVisible = false;
                    })
                    .finally(() => {
                        this.roleDrawerLoading = false;
                    });
            },
            handleSubmit () {
                this.$refs.userForm.validate(valid => {
                    if (!valid) return;
                    this.modalLoading = true;
                    const payload = {
                        username: this.formModel.username,
                        password: this.formModel.password,
                        nickname: this.formModel.nickname,
                        email: this.formModel.email,
                        phone: this.formModel.phone,
                        status: this.formModel.status
                    };
                    const request = this.modalMode === 'create'
                        ? UserCreate(payload)
                        : UserUpdate(this.formModel.id, this.buildUpdatePayload(payload));
                    request
                        .then(() => {
                            this.modalVisible = false;
                            this.fetchUsers();
                        })
                        .finally(() => {
                            this.modalLoading = false;
                        });
                });
            },
            buildUpdatePayload (payload) {
                const updateData = {
                    nickname: payload.nickname,
                    email: payload.email,
                    phone: payload.phone,
                    status: payload.status
                };
                if (payload.password && payload.password.trim()) {
                    updateData.password = payload.password;
                }
                return updateData;
            }
        }
    };
</script>

<style scoped>
    .role-list {
        max-height: 320px;
        overflow: auto;
        border: 1px solid #e8eaec;
        border-radius: 4px;
        padding: 8px 12px;
    }

    .drawer-footer {
        text-align: right;
        padding-top: 8px;
        border-top: 1px solid #e8eaec;
    }
</style>
