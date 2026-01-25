<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-menu" size="16" />
                <span class="ivu-pl-8">菜单管理</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="handleAdd">新增菜单</Button>
            </div>
            <Table :columns="columns" :data="menuTree" :loading="loading" row-key="id" :tree="true">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="green" v-if="row.status === 1">启用</Tag>
                    <Tag color="red" v-else>禁用</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" @click="handleEdit(row)">编辑</Button>
                    <Button size="small" class="ivu-ml-8" @click="handleAddChild(row)">新增子菜单</Button>
                    <Button size="small" type="warning" class="ivu-ml-8" v-if="row.parentId && row.parentId !== 0" @click="handleOpenActionModal(row)">新增操作</Button>
                    <Button size="small" class="ivu-ml-8" @click="handleOpenActionDetail(row)">操作详情</Button>
                    <Button size="small" type="error" class="ivu-ml-8" @click="handleDelete(row)">删除</Button>
                </template>
            </Table>
        </Card>

        <Modal v-model="modalVisible" :title="modalTitle" :mask-closable="false">
            <Form ref="menuForm" :model="formModel" :rules="rules" label-width="90">
                <FormItem label="上级菜单" prop="parentId">
                    <Select v-model="formModel.parentId" clearable>
                        <Option :value="0">顶级菜单</Option>
                        <Option
                            v-for="item in parentOptions"
                            :key="item.id"
                            :value="item.id"
                        >
                            {{ item.title }}
                        </Option>
                    </Select>
                </FormItem>
                <FormItem label="名称" prop="title">
                    <Input v-model="formModel.title" placeholder="菜单名称" />
                </FormItem>
                <FormItem label="路径" prop="path">
                    <Input v-model="formModel.path" placeholder="路由路径" />
                </FormItem>
                <FormItem label="图标" prop="icon">
                    <Input v-model="formModel.icon" placeholder="图标名称 (可选)" />
                </FormItem>
                <FormItem label="Header" prop="header">
                    <Input v-model="formModel.header" placeholder="顶栏分组 (可选)" />
                </FormItem>
                <FormItem label="排序" prop="sort">
                    <InputNumber v-model="formModel.sort" :min="0" />
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

        <Modal v-model="actionModalVisible" :title="actionModalTitle" :mask-closable="false">
            <Form ref="actionForm" :model="actionForm" :rules="actionRules" label-width="90">
                <FormItem label="菜单" prop="menuTitle">
                    <Input v-model="actionForm.menuTitle" disabled />
                </FormItem>
                <FormItem label="编码" prop="code">
                    <Input v-model="actionForm.code" placeholder="如 sys:user:create" :disabled="actionModalMode === 'view'" />
                </FormItem>
                <FormItem label="名称" prop="name">
                    <Input v-model="actionForm.name" placeholder="权限名称" :disabled="actionModalMode === 'view'" />
                </FormItem>
                <FormItem label="方法" prop="method">
                    <Input v-model="actionForm.method" placeholder="GET/POST/PUT/DELETE (可选)" :disabled="actionModalMode === 'view'" />
                </FormItem>
                <FormItem label="路径" prop="path">
                    <Input v-model="actionForm.path" placeholder="/api/xxx (可选)" :disabled="actionModalMode === 'view'" />
                </FormItem>
                <FormItem label="排序" prop="sort">
                    <InputNumber v-model="actionForm.sort" :min="0" :disabled="actionModalMode === 'view'" />
                </FormItem>
                <FormItem label="状态" prop="status">
                    <Select v-model="actionForm.status" :disabled="actionModalMode === 'view'">
                        <Option :value="1">启用</Option>
                        <Option :value="0">禁用</Option>
                    </Select>
                </FormItem>
            </Form>
            <div slot="footer">
                <Button @click="actionModalVisible = false">取消</Button>
                <Button v-if="actionModalMode !== 'view'" type="primary" :loading="actionModalLoading" @click="handleSubmitActionPermission">保存</Button>
            </div>
        </Modal>

        <Modal v-model="actionDetailVisible" title="操作权限详情" width="720" :mask-closable="false">
            <div class="ivu-mb-8">菜单：{{ actionDetailMenuTitle }}</div>
            <Table :columns="actionDetailColumns" :data="actionDetailList" :loading="actionDetailLoading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="green" v-if="row.status === 1">启用</Tag>
                    <Tag color="red" v-else>禁用</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" @click="handleViewAction(row)">查看</Button>
                    <Button size="small" type="primary" class="ivu-ml-8" @click="handleEditAction(row)">编辑</Button>
                    <Button size="small" type="error" class="ivu-ml-8" @click="handleDeleteAction(row)">删除</Button>
                </template>
            </Table>
            <div slot="footer">
                <Button @click="actionDetailVisible = false">关闭</Button>
            </div>
        </Modal>
    </div>
</template>

<script>
    import { MenuList, MenuCreate, MenuUpdate, MenuDelete, MenuAssignPermissions, MenuPermissionIds, MenuPermissionDetails } from '@api/menu';
    import { PermissionCreate, PermissionUpdate, PermissionDelete } from '@api/permission';
    import { Modal } from 'view-design';

    const defaultForm = () => ({
        id: null,
        parentId: 0,
        title: '',
        path: '',
        icon: '',
        header: '',
        sort: 0,
        status: 1
    });

    const defaultActionForm = () => ({
        menuId: null,
        menuTitle: '',
        id: null,
        code: '',
        name: '',
        method: '',
        path: '',
        sort: 0,
        status: 1
    });

    export default {
        name: 'menu',
        data () {
            return {
                loading: false,
                menuTree: [],
                columns: [
                    { title: '名称', key: 'title', minWidth: 160, tree: true },
                    { title: '路径', key: 'path', minWidth: 180 },
                    { title: '图标', key: 'icon', width: 120 },
                    { title: 'Header', key: 'header', width: 120 },
                    { title: '排序', key: 'sort', width: 80 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '操作', slot: 'actions', width: 340, align: 'center' }
                ],
                modalVisible: false,
                modalMode: 'create',
                modalLoading: false,
                actionModalVisible: false,
                actionModalLoading: false,
                actionModalMode: 'create',
                actionForm: defaultActionForm(),
                actionDetailVisible: false,
                actionDetailLoading: false,
                actionDetailMenuId: null,
                actionDetailMenuTitle: '',
                actionDetailList: [],
                actionDetailColumns: [
                    { title: '编码', key: 'code', minWidth: 160 },
                    { title: '名称', key: 'name', minWidth: 140 },
                    { title: '方法', key: 'method', width: 120 },
                    { title: '路径', key: 'path', minWidth: 180 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '操作', slot: 'actions', width: 200, align: 'center' }
                ],
                formModel: defaultForm(),
                rules: {
                    title: [{ required: true, message: '请输入名称', trigger: 'blur' }],
                    path: [{ required: true, message: '请输入路径', trigger: 'blur' }],
                    status: [{ required: true, type: 'number', message: '请选择状态', trigger: 'change' }]
                },
                actionRules: {
                    code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
                    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
                    sort: [{ required: true, type: 'number', message: '请输入排序', trigger: 'change' }],
                    status: [{ required: true, type: 'number', message: '请选择状态', trigger: 'change' }]
                }
            };
        },
        computed: {
            modalTitle () {
                return this.modalMode === 'create' ? '创建菜单' : '编辑菜单';
            },
            actionModalTitle () {
                if (this.actionModalMode === 'edit') return '编辑操作权限';
                if (this.actionModalMode === 'view') return '查看操作权限';
                return '新增操作权限';
            },
            parentOptions () {
                return this.menuTree
                    .filter(item => !item.parentId)
                    .filter(item => item.id !== this.formModel.id);
            }
        },
        created () {
            this.fetchMenus();
        },
        methods: {
            normalizeMenuTree (items) {
                return (items || []).map(item => {
                    const next = { ...item };
                    if (Array.isArray(next.children) && next.children.length) {
                        next.children = this.normalizeMenuTree(next.children);
                    } else {
                        delete next.children;
                    }
                    return next;
                });
            },
            fetchMenus () {
                this.loading = true;
                MenuList()
                    .then(res => {
                        const menuTree = Array.isArray(res) ? res : [];
                        this.menuTree = this.normalizeMenuTree(menuTree);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            handleAdd () {
                this.modalMode = 'create';
                this.formModel = defaultForm();
                this.modalVisible = true;
            },
            handleAddChild (row) {
                this.modalMode = 'create';
                this.formModel = {
                    ...defaultForm(),
                    parentId: row.id
                };
                this.modalVisible = true;
            },
            handleEdit (row) {
                this.modalMode = 'edit';
                this.formModel = {
                    id: row.id,
                    parentId: row.parentId || 0,
                    title: row.title,
                    path: row.path,
                    icon: row.icon,
                    header: row.header,
                    sort: row.sort || 0,
                    status: row.status
                };
                this.modalVisible = true;
            },
            handleDelete (row) {
                Modal.confirm({
                    title: '确认',
                    content: '确定删除该菜单吗？',
                    onOk: () => {
                        MenuDelete(row.id).then(() => {
                            this.fetchMenus();
                        });
                    }
                });
            },
            handleOpenActionModal (row) {
                this.actionForm = {
                    ...defaultActionForm(),
                    menuId: row.id,
                    menuTitle: row.title
                };
                this.actionModalMode = 'create';
                this.actionModalVisible = true;
            },
            handleSubmitActionPermission () {
                this.$refs.actionForm.validate(valid => {
                    if (!valid) return;
                    if (!this.actionForm.menuId) return;
                    this.actionModalLoading = true;
                    const payload = {
                        code: this.actionForm.code,
                        name: this.actionForm.name,
                        type: 'action',
                        method: this.actionForm.method,
                        path: this.actionForm.path,
                        sort: this.actionForm.sort,
                        status: this.actionForm.status
                    };
                    const request = this.actionModalMode === 'edit'
                        ? PermissionUpdate(this.actionForm.id, payload)
                        : PermissionCreate(payload);
                    request
                        .then(permission => {
                            if (this.actionModalMode === 'edit') {
                                return;
                            }
                            const permissionId = permission && permission.id;
                            if (!permissionId) return;
                            return MenuPermissionIds(this.actionForm.menuId)
                                .then(existingIds => {
                                    const merged = new Set(Array.isArray(existingIds) ? existingIds : []);
                                    merged.add(permissionId);
                                    return MenuAssignPermissions({
                                        menuId: this.actionForm.menuId,
                                        permissionIds: Array.from(merged)
                                    });
                                });
                        })
                        .then(() => {
                            this.actionModalVisible = false;
                            if (this.actionDetailVisible) {
                                this.fetchActionDetails(this.actionDetailMenuId);
                            }
                        })
                        .finally(() => {
                            this.actionModalLoading = false;
                        });
                });
            },
            handleOpenActionDetail (row) {
                this.actionDetailMenuId = row.id;
                this.actionDetailMenuTitle = row.title;
                this.actionDetailVisible = true;
                this.fetchActionDetails(row.id);
            },
            fetchActionDetails (menuId) {
                this.actionDetailLoading = true;
                MenuPermissionDetails(menuId)
                    .then(res => {
                        this.actionDetailList = Array.isArray(res) ? res : [];
                    })
                    .finally(() => {
                        this.actionDetailLoading = false;
                    });
            },
            handleViewAction (row) {
                this.actionForm = {
                    menuId: this.actionDetailMenuId,
                    menuTitle: this.actionDetailMenuTitle,
                    id: row.id,
                    code: row.code || '',
                    name: row.name || '',
                    method: row.method || '',
                    path: row.path || '',
                    sort: row.sort || 0,
                    status: typeof row.status === 'number' ? row.status : 1
                };
                this.actionModalMode = 'view';
                this.actionModalVisible = true;
            },
            handleEditAction (row) {
                this.actionForm = {
                    menuId: this.actionDetailMenuId,
                    menuTitle: this.actionDetailMenuTitle,
                    id: row.id,
                    code: row.code || '',
                    name: row.name || '',
                    method: row.method || '',
                    path: row.path || '',
                    sort: row.sort || 0,
                    status: typeof row.status === 'number' ? row.status : 1
                };
                this.actionModalMode = 'edit';
                this.actionModalVisible = true;
            },
            handleDeleteAction (row) {
                Modal.confirm({
                    title: '确认',
                    content: '确定删除该操作权限吗？',
                    onOk: () => {
                        PermissionDelete(row.id).then(() => {
                            this.fetchActionDetails(this.actionDetailMenuId);
                        });
                    }
                });
            },
            handleSubmit () {
                this.$refs.menuForm.validate(valid => {
                    if (!valid) return;
                    this.modalLoading = true;
                    const payload = {
                        parentId: this.formModel.parentId || 0,
                        title: this.formModel.title,
                        path: this.formModel.path,
                        icon: this.formModel.icon,
                        header: this.formModel.header,
                        sort: this.formModel.sort,
                        status: this.formModel.status
                    };
                    const request = this.modalMode === 'create'
                        ? MenuCreate(payload)
                        : MenuUpdate(this.formModel.id, payload);
                    request
                        .then(() => {
                            this.modalVisible = false;
                            this.fetchMenus();
                        })
                        .finally(() => {
                            this.modalLoading = false;
                        });
                });
            }
        }
    };
</script>
