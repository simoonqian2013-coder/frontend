<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-paw" size="16" />
                <span class="ivu-pl-8">宠物管理</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="handleAdd">新增宠物</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="关键词">
                    <Input v-model="query.keyword" placeholder="昵称/品种/城市" clearable />
                </FormItem>
                <FormItem label="类型">
                    <Select v-model="query.type" clearable style="width: 120px;">
                        <Option v-for="item in typeOptions" :key="item.value" :value="item.value">
                            {{ item.label }}
                        </Option>
                    </Select>
                </FormItem>
                <FormItem label="状态">
                    <Select v-model="query.status" clearable style="width: 120px;">
                        <Option :value="1">启用</Option>
                        <Option :value="0">禁用</Option>
                    </Select>
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSearch">查询</Button>
                    <Button class="ivu-ml-8" @click="handleReset">重置</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="type">
                    {{ formatType(row.type) }}
                </template>
                <template slot-scope="{ row }" slot="gender">
                    {{ formatGender(row.gender) }}
                </template>
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
            <Form ref="petForm" :model="formModel" :rules="formRules" label-width="90">
                <FormItem label="昵称" prop="nickname">
                    <Input v-model="formModel.nickname" placeholder="宠物昵称" />
                </FormItem>
                <FormItem label="品种">
                    <Input v-model="formModel.breed" placeholder="品种" />
                </FormItem>
                <FormItem label="类型" prop="type">
                    <Select v-model="formModel.type" placeholder="选择类型">
                        <Option v-for="item in typeOptions" :key="item.value" :value="item.value">
                            {{ item.label }}
                        </Option>
                    </Select>
                </FormItem>
                <FormItem label="性别">
                    <Select v-model="formModel.gender" placeholder="选择性别">
                        <Option v-for="item in genderOptions" :key="item.value" :value="item.value">
                            {{ item.label }}
                        </Option>
                    </Select>
                </FormItem>
                <FormItem label="年龄">
                    <InputNumber v-model="formModel.age" :min="0" style="width: 100%;" />
                </FormItem>
                <FormItem label="城市">
                    <Input v-model="formModel.city" placeholder="城市" />
                </FormItem>
                <FormItem label="地址">
                    <Input v-model="formModel.address" placeholder="详细地址" />
                </FormItem>
                <FormItem label="详情">
                    <Input v-model="formModel.detail" type="textarea" :rows="3" placeholder="详情描述" />
                </FormItem>
                <FormItem label="图片">
                    <Input v-model="formModel.image" placeholder="图片地址" />
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
    import { PetList, PetCreate, PetUpdate, PetDelete } from '@api/pet';
    import { Modal } from 'view-design';

    const defaultForm = () => ({
        id: null,
        nickname: '',
        breed: '',
        type: '',
        gender: '',
        age: null,
        city: '',
        address: '',
        detail: '',
        image: '',
        status: 1
    });

    export default {
        name: 'pet-list',
        data () {
            return {
                query: {
                    keyword: '',
                    type: '',
                    status: null,
                    page: 1,
                    size: 10
                },
                loading: false,
                allPets: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '昵称', key: 'nickname', minWidth: 140 },
                    { title: '品种', key: 'breed', minWidth: 140 },
                    { title: '类型', slot: 'type', width: 100 },
                    { title: '性别', slot: 'gender', width: 100 },
                    { title: '年龄', key: 'age', width: 80 },
                    { title: '城市', key: 'city', minWidth: 120 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '创建时间', key: 'createdAt', minWidth: 160 },
                    { title: '操作', slot: 'actions', width: 180, align: 'center' }
                ],
                modalVisible: false,
                modalMode: 'create',
                modalLoading: false,
                formModel: defaultForm(),
                typeOptions: [
                    { label: '猫', value: 'CAT' },
                    { label: '狗', value: 'DOG' }
                ],
                genderOptions: [
                    { label: '公', value: 'MALE' },
                    { label: '母', value: 'FEMALE' }
                ]
            };
        },
        computed: {
            modalTitle () {
                return this.modalMode === 'create' ? '新增宠物' : '编辑宠物';
            },
            total () {
                return this.allPets.length;
            },
            tableData () {
                const start = (this.query.page - 1) * this.query.size;
                return this.allPets.slice(start, start + this.query.size);
            },
            formRules () {
                return {
                    nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
                    type: [{ required: true, message: '请选择类型', trigger: 'change' }],
                    status: [{ required: true, type: 'number', message: '请选择状态', trigger: 'change' }]
                };
            }
        },
        created () {
            this.fetchPets();
        },
        methods: {
            fetchPets () {
                this.loading = true;
                PetList({
                    keyword: this.query.keyword,
                    type: this.query.type,
                    status: this.query.status
                })
                    .then(res => {
                        this.allPets = Array.isArray(res) ? res : [];
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
                this.fetchPets();
            },
            handleReset () {
                this.query.keyword = '';
                this.query.type = '';
                this.query.status = null;
                this.query.page = 1;
                this.fetchPets();
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
                    nickname: row.nickname,
                    breed: row.breed,
                    type: row.type,
                    gender: row.gender,
                    age: row.age,
                    city: row.city,
                    address: row.address,
                    detail: row.detail,
                    image: row.image,
                    status: row.status
                };
                this.modalVisible = true;
            },
            handleDelete (row) {
                Modal.confirm({
                    title: '确认',
                    content: '确定删除该宠物吗？',
                    onOk: () => {
                        PetDelete(row.id).then(() => {
                            this.fetchPets();
                        });
                    }
                });
            },
            handleSubmit () {
                this.$refs.petForm.validate(valid => {
                    if (!valid) return;
                    this.modalLoading = true;
                    const payload = {
                        nickname: this.formModel.nickname,
                        breed: this.formModel.breed,
                        type: this.formModel.type,
                        gender: this.formModel.gender,
                        age: this.formModel.age,
                        city: this.formModel.city,
                        address: this.formModel.address,
                        detail: this.formModel.detail,
                        image: this.formModel.image,
                        status: this.formModel.status
                    };
                    const request = this.modalMode === 'create'
                        ? PetCreate(payload)
                        : PetUpdate(this.formModel.id, payload);
                    request
                        .then(() => {
                            this.modalVisible = false;
                            this.fetchPets();
                        })
                        .finally(() => {
                            this.modalLoading = false;
                        });
                });
            },
            formatType (value) {
                const item = this.typeOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            },
            formatGender (value) {
                const item = this.genderOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            }
        }
    };
</script>
