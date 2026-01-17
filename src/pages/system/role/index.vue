<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-settings" size="16" />
                <span class="ivu-pl-8">Roles</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="handleAdd">New Role</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="Name">
                    <Input v-model="query.name" placeholder="Search by name" clearable />
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSearch">Search</Button>
                    <Button class="ivu-ml-8" @click="handleReset">Reset</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="green" v-if="row.status === 1">Active</Tag>
                    <Tag color="red" v-else>Disabled</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" @click="handleEdit(row)">Edit</Button>
                    <Button size="small" type="error" class="ivu-ml-8" @click="handleDelete(row)">Delete</Button>
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
                <FormItem label="Code" prop="code">
                    <Input v-model="formModel.code" placeholder="Role code" />
                </FormItem>
                <FormItem label="Name" prop="name">
                    <Input v-model="formModel.name" placeholder="Role name" />
                </FormItem>
                <FormItem label="Description" prop="description">
                    <Input v-model="formModel.description" type="textarea" :rows="3" />
                </FormItem>
                <FormItem label="Status" prop="status">
                    <Select v-model="formModel.status">
                        <Option :value="1">Active</Option>
                        <Option :value="0">Disabled</Option>
                    </Select>
                </FormItem>
            </Form>
            <div slot="footer">
                <Button @click="modalVisible = false">Cancel</Button>
                <Button type="primary" :loading="modalLoading" @click="handleSubmit">Save</Button>
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
                    { title: 'Code', key: 'code', minWidth: 120 },
                    { title: 'Name', key: 'name', minWidth: 120 },
                    { title: 'Description', key: 'description', minWidth: 160 },
                    { title: 'Status', slot: 'status', width: 100 },
                    { title: 'Created At', key: 'createdAt', minWidth: 160 },
                    { title: 'Actions', slot: 'actions', width: 180, align: 'center' }
                ],
                modalVisible: false,
                modalMode: 'create',
                modalLoading: false,
                formModel: defaultForm(),
                rules: {
                    code: [{ required: true, message: 'Code is required', trigger: 'blur' }],
                    name: [{ required: true, message: 'Name is required', trigger: 'blur' }],
                    status: [{ required: true, type: 'number', message: 'Status is required', trigger: 'change' }]
                }
            }
        },
        computed: {
            modalTitle () {
                return this.modalMode === 'create' ? 'Create Role' : 'Edit Role';
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
                    title: 'Confirm',
                    content: 'Delete this role?',
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
