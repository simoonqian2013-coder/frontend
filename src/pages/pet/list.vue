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
                <template slot-scope="{ row }" slot="image">
                    <div class="thumb-cell">
                        <img v-if="getMainImageUrl(row)" :src="getMainImageUrl(row)" alt="pet" />
                        <span v-else class="thumb-empty">-</span>
                    </div>
                </template>
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
                    <Upload
                        :action="uploadAction"
                        :headers="uploadHeaders"
                        :format="uploadFormats"
                        :max-size="uploadMaxSize"
                        :multiple="true"
                        :show-upload-list="false"
                        :on-success="handleUploadSuccess"
                        :on-error="handleUploadError"
                        :on-format-error="handleUploadFormatError"
                        :on-exceeded-size="handleUploadMaxSize"
                    >
                        <Button icon="md-cloud-upload">上传图片</Button>
                    </Upload>
                    <div class="image-list" v-if="formModel.imageUrls.length">
                        <div class="image-item" v-for="(item, index) in formModel.imageUrls" :key="item.url + index">
                            <img :src="item.url" alt="pet" />
                            <div class="image-actions">
                                <Tag color="blue" v-if="item.isMain">主图</Tag>
                                <Button
                                    v-else
                                    size="small"
                                    type="text"
                                    class="image-action"
                                    @click="setMainImage(index)"
                                >设为主图</Button>
                                <Button
                                    size="small"
                                    type="text"
                                    class="image-action"
                                    @click="moveImage(index, -1)"
                                    :disabled="index === 0"
                                >上移</Button>
                                <Button
                                    size="small"
                                    type="text"
                                    class="image-action"
                                    @click="moveImage(index, 1)"
                                    :disabled="index === formModel.imageUrls.length - 1"
                                >下移</Button>
                                <Button
                                    size="small"
                                    type="text"
                                    class="image-action image-remove"
                                    @click="removeImage(index)"
                                >删除</Button>
                            </div>
                        </div>
                    </div>
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
    import Setting from '@/setting';
    import util from '@/libs/util';
    import { Message, Modal } from 'view-design';

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
        imageUrls: [],
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
                    { title: '缩略图', slot: 'image', width: 100, align: 'center' },
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
                uploadAction: `${Setting.apiBaseURL}api/pets/images`,
                uploadFormats: ['jpg', 'jpeg', 'png', 'webp'],
                uploadMaxSize: 2048,
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
            },
            uploadHeaders () {
                const token = util.cookies.get('token');
                return token ? { Authorization: `Bearer ${token}` } : {};
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
                    imageUrls: this.normalizeImageUrls(row),
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
                        image: this.getMainImageUrl(this.formModel),
                        imageUrls: this.formModel.imageUrls,
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
            },
            normalizeImageUrls (row) {
                if (Array.isArray(row.imageUrls) && row.imageUrls.length) {
                    return row.imageUrls.map(item => ({
                        url: item.url,
                        isMain: Boolean(item.isMain)
                    }));
                }
                if (row.image) {
                    return [{ url: row.image, isMain: true }];
                }
                return [];
            },
            getMainImageUrl (row) {
                const list = Array.isArray(row.imageUrls) ? row.imageUrls : [];
                const mainItem = list.find(item => item && item.isMain);
                return (mainItem && mainItem.url) || (list[0] && list[0].url) || row.image || '';
            },
            handleUploadSuccess (response, file) {
                const url = (response && response.url)
                    || (response && response.data && response.data.url)
                    || (response && response.data && response.data[0] && response.data[0].url);
                if (!url) {
                    Message.error('上传失败：未返回图片地址');
                    return;
                }
                const newItem = { url, isMain: false };
                this.formModel.imageUrls.push(newItem);
                this.ensureMainImage();
            },
            handleUploadError () {
                Message.error('上传失败，请稍后重试');
            },
            handleUploadFormatError () {
                Message.warning('图片格式不支持，请上传 jpg/png/webp');
            },
            handleUploadMaxSize () {
                Message.warning('图片大小不能超过 2MB');
            },
            setMainImage (index) {
                this.formModel.imageUrls = this.formModel.imageUrls.map((item, idx) => ({
                    ...item,
                    isMain: idx === index
                }));
            },
            moveImage (index, delta) {
                const target = index + delta;
                if (target < 0 || target >= this.formModel.imageUrls.length) return;
                const list = [...this.formModel.imageUrls];
                const temp = list[index];
                list[index] = list[target];
                list[target] = temp;
                this.formModel.imageUrls = list;
            },
            removeImage (index) {
                this.formModel.imageUrls.splice(index, 1);
                this.ensureMainImage();
            },
            ensureMainImage () {
                const list = this.formModel.imageUrls;
                if (!list.length) return;
                const hasMain = list.some(item => item.isMain);
                if (!hasMain) {
                    list[0].isMain = true;
                }
            }
        }
    };
</script>

<style scoped>
    .image-list {
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .image-item {
        width: 140px;
        border: 1px solid #e8eaec;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
    }

    .image-item img {
        width: 100%;
        height: 100px;
        object-fit: cover;
        display: block;
        background: #f5f5f5;
    }

    .image-actions {
        padding: 6px 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        align-items: center;
    }

    .image-action {
        padding: 0;
    }

    .image-remove {
        color: #ed4014;
    }

    .thumb-cell {
        width: 60px;
        height: 60px;
        margin: 0 auto;
        border-radius: 4px;
        overflow: hidden;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .thumb-cell img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .thumb-empty {
        color: #999;
        font-size: 12px;
    }
</style>
