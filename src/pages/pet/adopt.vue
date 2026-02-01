<template>
    <div class="pet-adopt">
        <Card :bordered="false" dis-hover>
            <div slot="title">
                <Icon type="md-heart" size="16" />
                <span class="ivu-pl-8">宠物领养</span>
            </div>
            <Form inline :label-width="60" class="ivu-mb">
                <FormItem label="关键词">
                    <Input v-model="query.keyword" placeholder="昵称/品种" clearable />
                </FormItem>
                <FormItem label="类型">
                    <Select v-model="query.type" clearable style="width: 120px;">
                        <Option v-for="item in typeOptions" :key="item.value" :value="item.value">
                            {{ item.label }}
                        </Option>
                    </Select>
                </FormItem>
                <FormItem label="城市">
                    <Input v-model="query.city" placeholder="城市" clearable style="width: 140px;" />
                </FormItem>
                <FormItem label="年龄">
                    <InputNumber v-model="query.ageMin" :min="0" placeholder="最小" style="width: 90px;" />
                    <span class="range-sep">-</span>
                    <InputNumber v-model="query.ageMax" :min="0" placeholder="最大" style="width: 90px;" />
                </FormItem>
                <FormItem>
                    <Button type="primary" @click="handleSearch">查询</Button>
                    <Button class="ivu-ml-8" @click="handleReset">重置</Button>
                </FormItem>
            </Form>

            <Spin size="large" fix v-if="loading" />

            <div v-if="!loading && filteredPets.length === 0" class="empty">暂无可领养宠物</div>

            <Row :gutter="16" v-if="!loading && filteredPets.length">
                <Col
                    v-for="pet in pagedPets"
                    :key="pet.id"
                    :xs="24"
                    :sm="12"
                    :md="8"
                    :lg="6"
                    class="ivu-mb"
                >
                    <Card dis-hover class="pet-card">
                        <div class="cover">
                            <img :src="pet.image || defaultImage" alt="pet" />
                            <div class="badge">可领养</div>
                        </div>
                        <div class="info">
                            <div class="title">{{ pet.nickname || '-' }}</div>
                            <div class="meta">
                                <span>{{ formatType(pet.type) }}</span>
                                <span>{{ formatGender(pet.gender) }}</span>
                                <span>{{ pet.age != null ? pet.age + '岁' : '-' }}</span>
                            </div>
                            <div class="meta">
                                <span>{{ pet.breed || '-' }}</span>
                                <span>{{ pet.city || '-' }}</span>
                            </div>
                            <div class="desc">
                                {{ pet.detail || '暂无详情' }}
                            </div>
                        </div>
                        <div class="actions">
                            <Button size="small" @click="openDetail(pet)">详情</Button>
                            <Button size="small" type="primary" class="ivu-ml-8" @click="openApply(pet)">
                                我要领养
                            </Button>
                        </div>
                    </Card>
                </Col>
            </Row>

            <div class="ivu-mt">
                <Page
                    :total="filteredPets.length"
                    :current="query.page"
                    :page-size="query.size"
                    show-sizer
                    show-total
                    @on-change="handlePageChange"
                    @on-page-size-change="handlePageSizeChange"
                />
            </div>
        </Card>

        <Drawer v-model="detailVisible" width="520" title="宠物详情" :closable="true">
            <div v-if="currentPet">
                <img :src="currentPet.image || defaultImage" class="detail-cover" alt="pet" />
                <div class="detail-item"><span>昵称：</span>{{ currentPet.nickname }}</div>
                <div class="detail-item"><span>品种：</span>{{ currentPet.breed || '-' }}</div>
                <div class="detail-item"><span>类型：</span>{{ formatType(currentPet.type) }}</div>
                <div class="detail-item"><span>性别：</span>{{ formatGender(currentPet.gender) }}</div>
                <div class="detail-item"><span>年龄：</span>{{ currentPet.age != null ? currentPet.age + '岁' : '-' }}</div>
                <div class="detail-item"><span>城市：</span>{{ currentPet.city || '-' }}</div>
                <div class="detail-item"><span>地址：</span>{{ currentPet.address || '-' }}</div>
                <div class="detail-item"><span>详情：</span>{{ currentPet.detail || '-' }}</div>
                <div class="detail-footer">
                    <Button type="primary" @click="openApply(currentPet)">我要领养</Button>
                </div>
            </div>
        </Drawer>

        <Modal v-model="applyVisible" title="领养申请" :mask-closable="false">
            <Form ref="applyForm" :model="applyForm" :rules="applyRules" label-width="90">
                <FormItem label="申请人" prop="name">
                    <Input v-model="applyForm.name" placeholder="申请人姓名" />
                </FormItem>
                <FormItem label="手机号" prop="phone">
                    <Input v-model="applyForm.phone" placeholder="手机号" />
                </FormItem>
                <FormItem label="身份证">
                    <Input v-model="applyForm.idNumber" placeholder="身份证号（可选）" />
                </FormItem>
                <FormItem label="城市" prop="city">
                    <Input v-model="applyForm.city" placeholder="城市" />
                </FormItem>
                <FormItem label="地址" prop="address">
                    <Input v-model="applyForm.address" placeholder="详细地址" />
                </FormItem>
                <FormItem label="饲养经验">
                    <Input v-model="applyForm.experience" type="textarea" :rows="2" placeholder="家庭情况/饲养经验" />
                </FormItem>
                <FormItem label="备注">
                    <Input v-model="applyForm.remark" type="textarea" :rows="2" placeholder="补充说明" />
                </FormItem>
            </Form>
            <div slot="footer">
                <Button @click="applyVisible = false">取消</Button>
                <Button type="primary" :loading="applyLoading" @click="submitApply">提交申请</Button>
            </div>
        </Modal>
    </div>
</template>

<script>
    import { PetList } from '@api/pet';
    import { AdoptionCreate } from '@api/adoption';
    import util from '@/libs/util';
    import { Message } from 'view-design';

    const defaultApplyForm = () => ({
        name: '',
        phone: '',
        idNumber: '',
        city: '',
        address: '',
        experience: '',
        remark: ''
    });

    export default {
        name: 'pet-adopt',
        data () {
            return {
                query: {
                    keyword: '',
                    type: '',
                    city: '',
                    ageMin: null,
                    ageMax: null,
                    page: 1,
                    size: 8
                },
                loading: false,
                allPets: [],
                detailVisible: false,
                applyVisible: false,
                applyLoading: false,
                currentPet: null,
                applyForm: defaultApplyForm(),
                typeOptions: [
                    { label: '猫', value: 'CAT' },
                    { label: '狗', value: 'DOG' }
                ],
                genderOptions: [
                    { label: '公', value: 'MALE' },
                    { label: '母', value: 'FEMALE' }
                ],
                defaultImage: 'https://via.placeholder.com/300x200?text=Pet'
            };
        },
        computed: {
            filteredPets () {
                let list = Array.isArray(this.allPets) ? this.allPets : [];
                list = list.filter(item => item.status === 1);
                if (this.query.city) {
                    const city = this.query.city.trim().toLowerCase();
                    list = list.filter(item => (item.city || '').toLowerCase().includes(city));
                }
                if (this.query.ageMin != null) {
                    list = list.filter(item => item.age != null && item.age >= this.query.ageMin);
                }
                if (this.query.ageMax != null) {
                    list = list.filter(item => item.age != null && item.age <= this.query.ageMax);
                }
                return list;
            },
            pagedPets () {
                const start = (this.query.page - 1) * this.query.size;
                return this.filteredPets.slice(start, start + this.query.size);
            },
            applyRules () {
                return {
                    name: [{ required: true, message: '请输入申请人姓名', trigger: 'blur' }],
                    phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
                    city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
                    address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }]
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
                    status: 1
                })
                    .then(res => {
                        this.allPets = Array.isArray(res) ? res : [];
                        this.ensurePageInRange();
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            handleSearch () {
                this.query.page = 1;
                this.fetchPets();
            },
            handleReset () {
                this.query.keyword = '';
                this.query.type = '';
                this.query.city = '';
                this.query.ageMin = null;
                this.query.ageMax = null;
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
            ensurePageInRange () {
                const totalPages = Math.max(1, Math.ceil(this.filteredPets.length / this.query.size));
                if (this.query.page > totalPages) {
                    this.query.page = totalPages;
                }
            },
            formatType (value) {
                const item = this.typeOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            },
            formatGender (value) {
                const item = this.genderOptions.find(option => option.value === value);
                return item ? item.label : value || '-';
            },
            openDetail (pet) {
                this.currentPet = pet;
                this.detailVisible = true;
            },
            openApply (pet) {
                const token = util.cookies.get('token');
                if (!token) {
                    Message.warning('请先登录后再提交领养申请');
                    return;
                }
                this.currentPet = pet;
                this.applyForm = defaultApplyForm();
                this.applyVisible = true;
            },
            submitApply () {
                this.$refs.applyForm.validate(valid => {
                    if (!valid) return;
                    this.applyLoading = true;
                    AdoptionCreate({
                        petId: this.currentPet ? this.currentPet.id : null,
                        applicantName: this.applyForm.name,
                        phone: this.applyForm.phone,
                        idNumber: this.applyForm.idNumber,
                        city: this.applyForm.city,
                        address: this.applyForm.address,
                        experience: this.applyForm.experience,
                        remark: this.applyForm.remark
                    })
                        .then(() => {
                            this.applyVisible = false;
                            Message.success('申请已提交（等待审核）');
                        })
                        .finally(() => {
                            this.applyLoading = false;
                        });
                });
            }
        }
    };
</script>

<style scoped>
    .pet-adopt {
        position: relative;
    }

    .pet-card {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .cover {
        position: relative;
        height: 160px;
        overflow: hidden;
        border-radius: 4px;
        background: #f5f5f5;
    }

    .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    .badge {
        position: absolute;
        right: 8px;
        top: 8px;
        padding: 2px 8px;
        background: #19be6b;
        color: #fff;
        border-radius: 12px;
        font-size: 12px;
    }

    .info {
        padding: 10px 0 6px;
    }

    .title {
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 6px;
    }

    .meta {
        display: flex;
        gap: 12px;
        color: #666;
        font-size: 12px;
        line-height: 1.6;
    }

    .desc {
        margin-top: 6px;
        color: #888;
        font-size: 12px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .actions {
        margin-top: auto;
        padding-top: 8px;
        display: flex;
        justify-content: flex-end;
    }

    .detail-cover {
        width: 100%;
        height: 220px;
        object-fit: cover;
        border-radius: 6px;
        margin-bottom: 12px;
        background: #f5f5f5;
    }

    .detail-item {
        margin-bottom: 8px;
        color: #555;
    }

    .detail-item span {
        display: inline-block;
        width: 64px;
        color: #333;
    }

    .detail-footer {
        margin-top: 16px;
        text-align: right;
    }

    .empty {
        padding: 40px 0;
        text-align: center;
        color: #999;
    }

    .range-sep {
        display: inline-block;
        margin: 0 6px;
        color: #999;
    }
</style>
