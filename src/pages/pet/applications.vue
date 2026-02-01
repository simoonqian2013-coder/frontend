<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-document" size="16" />
                <span class="ivu-pl-8">领养申请</span>
            </div>
            <div slot="extra">
                <Button type="primary" @click="fetchList">刷新</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="状态">
                    <Select v-model="query.status" clearable style="width: 140px;">
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
                <div class="detail-item"><span>地址：</span>{{ currentRow.address }}</div>
                <div class="detail-item"><span>备注：</span>{{ currentRow.remark || '-' }}</div>
                <div class="detail-item"><span>状态：</span>{{ statusText(currentRow.status) }}</div>
                <div class="detail-item" v-if="currentRow.reviewRemark">
                    <span>审核意见：</span>{{ currentRow.reviewRemark }}
                </div>
            </div>
        </Drawer>
    </div>
</template>

<script>
    import { AdoptionMyList } from '@api/adoption';

    export default {
        name: 'pet-applications',
        data () {
            return {
                query: {
                    status: null,
                    page: 1,
                    size: 10
                },
                loading: false,
                allList: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '宠物名称', key: 'petNickname', minWidth: 140 },
                    { title: '手机号', key: 'phone', minWidth: 140 },
                    { title: '提交时间', key: 'createdAt', minWidth: 160 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '操作', slot: 'actions', width: 120, align: 'center' }
                ],
                detailVisible: false,
                currentRow: null,
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
            filteredList () {
                if (this.query.status === null || this.query.status === undefined) {
                    return this.allList;
                }
                return this.allList.filter(item => item.status === this.query.status);
            },
            total () {
                return this.filteredList.length;
            },
            tableData () {
                const start = (this.query.page - 1) * this.query.size;
                return this.filteredList.slice(start, start + this.query.size);
            }
        },
        created () {
            this.fetchList();
        },
        methods: {
            fetchList () {
                this.loading = true;
                AdoptionMyList()
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
                this.ensurePageInRange();
            },
            handleReset () {
                this.query.status = null;
                this.query.page = 1;
                this.ensurePageInRange();
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
