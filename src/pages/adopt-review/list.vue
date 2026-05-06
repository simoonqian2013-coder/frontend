<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-clipboard" size="16" />
                <span class="ivu-pl-8">领养审核</span>
            </div>
            <div slot="extra">
                <Button class="ivu-mr-8" @click="exportCsv" :disabled="!allList.length">导出CSV</Button>
                <Button type="primary" @click="fetchList">刷新</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="关键字">
                    <Input v-model="query.keyword" placeholder="宠物/申请人/手机号" clearable />
                </FormItem>
                <FormItem label="状态">
                    <Select v-model="query.status" clearable style="width: 120px;">
                        <Option :value="0">待审核</Option>
                        <Option :value="1">已通过</Option>
                        <Option :value="2">已拒绝</Option>
                    </Select>
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSearch">查询</Button>
                    <Button class="ivu-ml-8" @click="handleReset">重置</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="orange" v-if="row.status === 0">待审核</Tag>
                    <Tag color="green" v-else-if="row.status === 1">已通过</Tag>
                    <Tag color="red" v-else>已拒绝</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" @click="handleView(row)">查看</Button>
                    <Button
                        size="small"
                        class="ivu-ml-8"
                        type="warning"
                        :disabled="row.status !== 0"
                        @click="handleReview(row)"
                    >
                        审核
                    </Button>
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

        <Drawer v-model="detailVisible" width="520" title="申请详情" :closable="true">
            <div v-if="currentRow">
                <div class="detail-item"><span>宠物：</span>{{ currentRow.petNickname }}</div>
                <div class="detail-item"><span>类型：</span>{{ formatType(currentRow.petType) }}</div>
                <div class="detail-item"><span>性别：</span>{{ formatGender(currentRow.petGender) }}</div>
                <div class="detail-item"><span>年龄：</span>{{ currentRow.petAge != null ? currentRow.petAge + '岁' : '-' }}</div>
                <div class="detail-item"><span>城市：</span>{{ currentRow.petCity || '-' }}</div>
                <div class="detail-item"><span>申请人：</span>{{ currentRow.applicantName }}</div>
                <div class="detail-item"><span>手机号：</span>{{ currentRow.phone }}</div>
                <div class="detail-item"><span>邮箱：</span>{{ currentRow.email || '-' }}</div>
                <div class="detail-item"><span>地址：</span>{{ currentRow.address }}</div>
                <div class="detail-item"><span>备注：</span>{{ currentRow.remark || '-' }}</div>
                <div class="detail-item"><span>状态：</span>{{ statusText(currentRow.status) }}</div>
                <div class="detail-item" v-if="currentRow.reviewRemark">
                    <span>审核意见：</span>{{ currentRow.reviewRemark }}
                </div>
            </div>
        </Drawer>

        <Modal v-model="reviewVisible" title="领养审核" :mask-closable="false">
            <Form ref="reviewForm" :model="reviewForm" :rules="reviewRules" label-width="80">
                <FormItem label="结果" prop="status">
                    <RadioGroup v-model="reviewForm.status">
                        <Radio :label="1">通过</Radio>
                        <Radio :label="2">拒绝</Radio>
                    </RadioGroup>
                </FormItem>
                <FormItem label="备注" prop="remark">
                    <Input v-model="reviewForm.remark" type="textarea" :rows="3" placeholder="审核意见/拒绝原因" />
                </FormItem>
            </Form>
            <div slot="footer">
                <Button @click="reviewVisible = false">取消</Button>
                <Button type="primary" :loading="reviewLoading" @click="submitReview">提交</Button>
            </div>
        </Modal>
    </div>
</template>

<script>
    import { AdoptionList, AdoptionReview } from '@api/adoption';

    const defaultReviewForm = () => ({
        status: 1,
        remark: ''
    });

    export default {
        name: 'adopt-review-list',
        data () {
            return {
                query: {
                    keyword: '',
                    status: null,
                    page: 1,
                    size: 10
                },
                loading: false,
                allList: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '申请人', key: 'applicantName', minWidth: 120 },
                    { title: '手机号', key: 'phone', minWidth: 140 },
                    { title: '宠物名称', key: 'petNickname', minWidth: 160 },
                    { title: '提交时间', key: 'createdAt', minWidth: 160 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '操作', slot: 'actions', width: 160, align: 'center' }
                ],
                detailVisible: false,
                reviewVisible: false,
                reviewLoading: false,
                currentRow: null,
                reviewForm: defaultReviewForm(),
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
            total () {
                return this.allList.length;
            },
            tableData () {
                const start = (this.query.page - 1) * this.query.size;
                return this.allList.slice(start, start + this.query.size);
            },
            reviewRules () {
                return {
                    status: [{ required: true, type: 'number', message: '请选择审核结果', trigger: 'change' }],
                    remark: [{ validator: this.validateRemark, trigger: 'blur' }]
                };
            }
        },
        created () {
            this.fetchList();
        },
        methods: {
            fetchList () {
                this.loading = true;
                AdoptionList({
                    keyword: this.query.keyword,
                    status: this.query.status
                })
                    .then(res => {
                        this.allList = Array.isArray(res) ? res : [];
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
                this.fetchList();
            },
            handleReset () {
                this.query.keyword = '';
                this.query.status = null;
                this.query.page = 1;
                this.fetchList();
            },
            handlePageChange (page) {
                this.query.page = page;
            },
            handlePageSizeChange (size) {
                this.query.size = size;
                this.query.page = 1;
                this.ensurePageInRange();
            },
            handleView (row) {
                this.currentRow = row;
                this.detailVisible = true;
            },
            handleReview (row) {
                this.currentRow = row;
                this.reviewForm = defaultReviewForm();
                this.reviewVisible = true;
            },
            submitReview () {
                if (!this.currentRow) return;
                this.$refs.reviewForm.validate(valid => {
                    if (!valid) return;
                    this.reviewLoading = true;
                    AdoptionReview(this.currentRow.id, {
                        status: this.reviewForm.status,
                        remark: this.reviewForm.remark
                    })
                        .then(() => {
                            this.reviewVisible = false;
                            this.fetchList();
                        })
                        .finally(() => {
                            this.reviewLoading = false;
                        });
                });
            },
            exportCsv () {
                const headers = ['ID', '申请人', '手机号', '邮箱', '宠物名称', '提交时间', '状态', '地址', '备注'];
                const rows = this.allList.map(item => [
                    item.id,
                    item.applicantName,
                    item.phone,
                    item.email || '',
                    item.petNickname,
                    item.createdAt,
                    this.statusText(item.status),
                    item.address || '',
                    item.remark || ''
                ]);
                const content = [headers, ...rows]
                    .map(row => row.map(this.escapeCsvCell).join(','))
                    .join('\r\n');
                const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `领养申请_${this.formatExportTime()}.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
            },
            escapeCsvCell (value) {
                const text = value == null ? '' : String(value);
                return `"${text.replace(/"/g, '""')}"`;
            },
            formatExportTime () {
                const date = new Date();
                const pad = value => String(value).padStart(2, '0');
                return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
            },
            validateRemark (rule, value, callback) {
                if (this.reviewForm.status === 2 && (!value || !value.trim())) {
                    callback(new Error('拒绝时必须填写原因'));
                    return;
                }
                callback();
            },
            formatType (value) {
                const item = this.typeOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            },
            formatGender (value) {
                const item = this.genderOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            },
            statusText (value) {
                if (value === 0) return '待审核';
                if (value === 1) return '已通过';
                if (value === 2) return '已拒绝';
                return '-';
            }
        }
    };
</script>

<style scoped>
    .detail-item {
        margin-bottom: 8px;
        color: #555;
    }

    .detail-item span {
        display: inline-block;
        width: 64px;
        color: #333;
    }
</style>
