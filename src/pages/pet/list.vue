<template>
    <div class="i-table-no-border">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-paw" size="16" />
                <span class="ivu-pl-8">宠物管理</span>
            </div>
            <div slot="extra">
                <Button type="primary" disabled>新增宠物</Button>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="名称">
                    <Input placeholder="按名称搜索" disabled />
                </FormItem>
                <FormItem label="状态">
                    <Select disabled style="width: 120px;">
                        <Option :value="1">启用</Option>
                        <Option :value="0">禁用</Option>
                    </Select>
                </FormItem>
                <FormItem>
                    <Button type="primary" disabled>查询</Button>
                    <Button class="ivu-ml-8" disabled>重置</Button>
                </FormItem>
            </Form>
            <Table :columns="columns" :data="tableData" :loading="loading">
                <template slot-scope="{ row }" slot="status">
                    <Tag color="green" v-if="row.status === 1">启用</Tag>
                    <Tag color="red" v-else>禁用</Tag>
                </template>
                <template slot-scope="{ row }" slot="actions">
                    <Button size="small" type="primary" disabled>查看</Button>
                    <Button size="small" class="ivu-ml-8" disabled>编辑</Button>
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
        name: 'pet-list',
        data () {
            return {
                loading: false,
                tableData: [],
                columns: [
                    { title: 'ID', key: 'id', width: 80 },
                    { title: '名称', key: 'name', minWidth: 160 },
                    { title: '品种', key: 'breed', minWidth: 140 },
                    { title: '年龄', key: 'age', width: 80 },
                    { title: '状态', slot: 'status', width: 100 },
                    { title: '创建时间', key: 'createdAt', minWidth: 160 },
                    { title: '操作', slot: 'actions', width: 160, align: 'center' }
                ]
            };
        }
    };
</script>
