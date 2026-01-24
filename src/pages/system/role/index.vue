<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-settings" size="16" />
                <span class="ivu-pl-8">角色管理</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="handleAdd">新增角色</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="名称">
                    <Input v-model="query.name" placeholder="按名称搜索" clearable />
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
                    <Button size="small" class="ivu-ml-8" @click="handleAssignPermissions(row)">权限</Button>
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
            <Form ref="roleForm" :model="formModel" :rules="rules" label-width="90">
                <FormItem label="编码" prop="code">
                    <Input v-model="formModel.code" placeholder="角色编码" />
                </FormItem>
                <FormItem label="名称" prop="name">
                    <Input v-model="formModel.name" placeholder="角色名称" />
                </FormItem>
                <FormItem label="描述" prop="description">
                    <Input v-model="formModel.description" type="textarea" :rows="3" />
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
            title="分配权限"
            v-model="drawerVisible"
            width="420"
            :closable="true"
            :mask-closable="false"
        >
            <div class="ivu-mb">
                <div class="ivu-mb-8">角色：{{ currentRoleName }}</div>
                <div class="permission-list">
                    <Tree
                        :data="permissionTree"
                        show-checkbox
                        :multiple="true"
                        @on-check-change="handlePermissionCheckChange"
                    />
                </div>
            </div>
            <div class="drawer-footer">
                <Button @click="drawerVisible = false">取消</Button>
                <Button type="primary" :loading="drawerLoading" class="ivu-ml-8" @click="handleSavePermissions">保存</Button>
            </div>
        </Drawer>
    </div>
</template>

<script>
    import { RoleList, RoleCreate, RoleUpdate, RoleDelete, RoleAssignPermissions, RolePermissionIds } from '@api/role';
    import { PermissionList } from '@api/permission';
    import { Modal } from 'view-design';

    const defaultForm = () => ({
        id: null,
        code: '',
        name: '',
        description: '',
        status: 1
    });

    export default {
        name: 'role',
        data () {
            return {
                query: {
                    name: '',
                    page: 1,
                    size: 10
                },
                total: 0,
                loading: false,
                tableData: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '编码', key: 'code', minWidth: 120 },
                    { title: '名称', key: 'name', minWidth: 120 },
                    { title: '描述', key: 'description', minWidth: 160 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '创建时间', key: 'createdAt', minWidth: 160 },
                    { title: '操作', slot: 'actions', width: 180, align: 'center' }
                ],
                modalVisible: false,
                modalMode: 'create',
                modalLoading: false,
                formModel: defaultForm(),
                drawerVisible: false,
                drawerLoading: false,
                permissions: [],
                checkedPermissionIds: [],
                currentRoleId: null,
                currentRoleName: '',
                rules: {
                    code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
                    name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
                    status: [{ required: true, type: 'number', message: '请选择状态', trigger: 'change' }]
                }
            }
        },
        computed: {
            modalTitle () {
                return this.modalMode === 'create' ? '创建角色' : '编辑角色';
            },
            permissionTree () {
                return this.buildPermissionTree(this.permissions, this.checkedPermissionIds);
            }
        },
        created () {
            this.fetchRoles();
        },
        methods: {
            buildPermissionTree (permissions, checkedIds) {
                const checkedSet = new Set(checkedIds || []);
                const menuPermissions = [];
                const actionPermissions = [];
                (permissions || []).forEach(item => {
                    if (item.code && item.code.startsWith('menu:')) {
                        menuPermissions.push(item);
                    } else {
                        actionPermissions.push(item);
                    }
                });

                const menuRoot = {
                    title: '菜单权限',
                    id: 'menu-root',
                    expand: true,
                    children: this.buildMenuTree(menuPermissions, checkedSet)
                };
                const actionRoot = {
                    title: '操作权限',
                    id: 'action-root',
                    expand: true,
                    children: actionPermissions.map(item => ({
                        title: `${item.name} (${item.code})`,
                        id: item.id,
                        checked: checkedSet.has(item.id)
                    }))
                };

                const tree = [];
                if (menuRoot.children.length) tree.push(menuRoot);
                if (actionRoot.children.length) tree.push(actionRoot);
                return tree;
            },
            buildMenuTree (menuPermissions, checkedSet) {
                const root = {};
                const ensureNode = (map, key, title, id) => {
                    if (!map[key]) {
                        map[key] = {
                            title,
                            id,
                            expand: true,
                            children: []
                        };
                    }
                    return map[key];
                };
                const topLevel = [];

                menuPermissions.forEach(item => {
                    const parts = item.code.replace('menu:', '').split(':');
                    if (!parts.length) return;
                    const topKey = parts[0];
                    const topNode = ensureNode(root, topKey, item.name || topKey, `menu-${topKey}`);
                    if (!topLevel.includes(topNode)) topLevel.push(topNode);
                    if (parts.length === 1) {
                        topNode.title = `${item.name} (${item.code})`;
                        topNode.id = item.id;
                        topNode.checked = checkedSet.has(item.id);
                        return;
                    }
                    let parent = topNode;
                    for (let i = 1; i < parts.length; i += 1) {
                        const codePath = `menu:${parts.slice(0, i + 1).join(':')}`;
                        const label = item.code === codePath ? `${item.name} (${item.code})` : parts[i];
                        let child = parent.children.find(node => node._codePath === codePath);
                        if (!child) {
                            child = {
                                title: label,
                                id: item.code === codePath ? item.id : `menu-${codePath}`,
                                expand: true,
                                children: [],
                                _codePath: codePath
                            };
                            parent.children.push(child);
                        }
                        if (item.code === codePath) {
                            child.title = `${item.name} (${item.code})`;
                            child.id = item.id;
                            child.checked = checkedSet.has(item.id);
                        }
                        parent = child;
                    }
                });

                const clean = nodes => nodes.map(node => {
                    const next = {
                        title: node.title,
                        id: node.id,
                        expand: node.expand
                    };
                    if (node.checked) next.checked = true;
                    if (node.children && node.children.length) {
                        next.children = clean(node.children);
                    }
                    return next;
                });

                return clean(topLevel);
            },
            fetchRoles () {
                this.loading = true;
                const params = {
                    page: this.query.page,
                    size: this.query.size
                };
                if (this.query.name) params.name = this.query.name;
                RoleList(params)
                    .then(res => {
                        this.tableData = res.records || [];
                        this.total = res.total || 0;
                        this.query.page = res.current || this.query.page;
                        this.query.size = res.size || this.query.size;
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            handleSearch () {
                this.query.page = 1;
                this.fetchRoles();
            },
            handleReset () {
                this.query.name = '';
                this.query.page = 1;
                this.fetchRoles();
            },
            handlePageChange (page) {
                this.query.page = page;
                this.fetchRoles();
            },
            handlePageSizeChange (size) {
                this.query.size = size;
                this.query.page = 1;
                this.fetchRoles();
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
                    code: row.code,
                    name: row.name,
                    description: row.description,
                    status: row.status
                };
                this.modalVisible = true;
            },
            handleDelete (row) {
                Modal.confirm({
                    title: '确认',
                    content: '确定删除该角色吗？',
                    onOk: () => {
                        RoleDelete(row.id).then(() => {
                            if (this.tableData.length === 1 && this.query.page > 1) {
                                this.query.page -= 1;
                            }
                            this.fetchRoles();
                        });
                    }
                });
            },
            handleSubmit () {
                this.$refs.roleForm.validate(valid => {
                    if (!valid) return;
                    this.modalLoading = true;
                    const payload = {
                        code: this.formModel.code,
                        name: this.formModel.name,
                        description: this.formModel.description,
                        status: this.formModel.status
                    };
                    const request = this.modalMode === 'create'
                        ? RoleCreate(payload)
                        : RoleUpdate(this.formModel.id, payload);
                    request
                        .then(() => {
                            this.modalVisible = false;
                            this.fetchRoles();
                        })
                        .finally(() => {
                            this.modalLoading = false;
                        });
                });
            },
            handleAssignPermissions (row) {
                this.currentRoleId = row.id;
                this.currentRoleName = row.name;
                this.drawerVisible = true;
                this.drawerLoading = true;
                Promise.all([PermissionList(), RolePermissionIds(row.id)])
                    .then(([permissions, selectedIds]) => {
                        this.permissions = Array.isArray(permissions) ? permissions : [];
                        this.checkedPermissionIds = Array.isArray(selectedIds) ? selectedIds : [];
                    })
                    .finally(() => {
                        this.drawerLoading = false;
                    });
            },
            handleSavePermissions () {
                if (!this.currentRoleId) return;
                this.drawerLoading = true;
                RoleAssignPermissions({
                    roleId: this.currentRoleId,
                    permissionIds: this.checkedPermissionIds
                })
                    .then(() => {
                        this.drawerVisible = false;
                    })
                    .finally(() => {
                        this.drawerLoading = false;
                    });
            },
            handlePermissionCheckChange (checkedNodes) {
                const ids = checkedNodes
                    .map(node => node.id)
                    .filter(id => typeof id === 'number');
                this.checkedPermissionIds = ids;
            }
        }
    }
</script>

<style scoped>
    .permission-list {
        max-height: 360px;
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
