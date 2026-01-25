<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-clipboard" size="16" />
                <span class="ivu-pl-8">领养审核</span>
            </div>
            <div slot="extra">
                <Button type="primary" disabled>新建申请</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="关键字">
                    <Input placeholder="按名称搜索" disabled />
                </FormItem>
                <FormItem label="状态">
                    <Select disabled style="width: 120px;">
                        <Option :value="1">待审核</Option>
                        <Option :value="2">已通过</Option>
                        <Option :value="3">已拒绝</Option>
                    </Select>
                </FormItem>
                <FormItem>
                    <Button type="primary" disabled>查询</Button>
                    <Button class="ivu-ml-8" disabled>重置</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="orange" v-if="row.status === 1">待审核</Tag>
                    <Tag color="green" v-else-if="row.status === 2">已通过</Tag>
                    <Tag color="red" v-else>已拒绝</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" disabled>查看</Button>
                    <Button size="small" class="ivu-ml-8" disabled>审核</Button>
                </template>
            </Table>
            <div class="ivu-mt">
                <Page
                    :total="0"
                    :current="1"
                    :page-size="10"
                    show-sizer
                    show-total
                    disabled
                />
            </div>
        </Card>
    </div>
</template>

<script>
    export default {
        name: 'adopt-review-list',
        data () {
            return {
                loading: false,
                tableData: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '申请人', key: 'applicant', minWidth: 160 },
                    { title: '宠物名称', key: 'petName', minWidth: 160 },
                    { title: '提交时间', key: 'createdAt', minWidth: 160 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '操作', slot: 'actions', width: 160, align: 'center' }
                ]
            };
        }
    };
</script>
