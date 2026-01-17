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
    </div>
</template>

<script>
    import { RoleList, RoleCreate, RoleUpdate, RoleDelete } from '@api/role';
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
            }
        },
        created () {
            this.fetchRoles();
        },
        methods: {
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
            }
        }
    }
</script>
