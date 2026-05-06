<template>
    <div class="dashboard-console">
        <Row :gutter="16" class="stats-row">
            <Col :xs="24" :sm="12" :md="6" class="card-col">
                <Card class="fill-card">
                    <div class="stat-card">
                        <div class="stat-title">今日新增宠物</div>
                        <div class="stat-value">{{ stats.todayNewPets }}</div>
                        <div class="stat-meta">基于今日数据</div>
                    </div>
                </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6" class="card-col">
                <Card class="fill-card">
                    <div class="stat-card">
                        <div class="stat-title">待审核领养</div>
                        <div class="stat-value">{{ stats.pendingAdoptions }}</div>
                        <div class="stat-meta">需尽快处理</div>
                    </div>
                </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6" class="card-col">
                <Card class="fill-card">
                    <div class="stat-card">
                        <div class="stat-title">本月通过领养</div>
                        <div class="stat-value">{{ stats.monthApprovedAdoptions }}</div>
                        <div class="stat-meta">通过率 {{ stats.monthApprovalRate }}%</div>
                    </div>
                </Card>
            </Col>
            <Col :xs="24" :sm="12" :md="6" class="card-col">
                <Card class="fill-card">
                    <div class="stat-card">
                        <div class="stat-title">在册宠物数</div>
                        <div class="stat-value">{{ stats.totalPets }}</div>
                        <div class="stat-meta">可领养 {{ stats.availablePets }}</div>
                    </div>
                </Card>
            </Col>
        </Row>

        <Row :gutter="16" class="block-row">
            <Col :xs="24" :md="16" class="card-col">
                <Card title="待办 · 领养申请" class="fill-card pending-card">
                    <Table :columns="pendingColumns" :data="pendingData" size="small" />
                    <div class="table-footer">
                        <Button type="primary" ghost @click="goToAdoptionReviewList">查看全部申请</Button>
                    </div>
                </Card>
            </Col>
            <Col :xs="24" :md="8" class="card-col side-stack">
                <Card title="提醒" class="fill-card">
                    <ul class="reminder-list">
                        <li><Badge status="error" /> 超过 7 天未处理的申请：{{ reminders.overduePending }}</li>
                        <li><Badge status="warning" /> 缺少主图的宠物：{{ reminders.missingMainImage }}</li>
                        <li><Badge status="processing" /> 领养审核高峰期：{{ reminders.peakTime }}</li>
                    </ul>
                </Card>
                <Card title="公告" class="stack-card fill-card">
                    <div class="notice">{{ notice.content }}</div>
                    <div class="notice-meta">更新：{{ notice.updatedBy }} · {{ notice.updatedAt }}</div>
                </Card>
            </Col>
        </Row>

        <Row :gutter="16" class="block-row">
            <Col :xs="24" :md="16" class="card-col">
                <Card title="领养申请趋势（近 7 天）" class="fill-card">
                    <div class="trend">
                        <div class="trend-item" v-for="item in trendData" :key="item.day">
                            <span class="trend-label">{{ item.day }}</span>
                            <div class="trend-bar">
                                <Progress :percent="item.percent" :stroke-width="10" />
                                <span class="trend-count">{{ item.count }}</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </Col>
            <Col :xs="24" :md="8" class="card-col">
                <Card title="地区分布" class="fill-card">
                    <ul class="city-list">
                        <li v-for="city in cityData" :key="city.name">
                            <span>{{ city.name }}</span>
                            <span class="city-count">{{ city.count }}</span>
                        </li>
                    </ul>
                </Card>
            </Col>
        </Row>

        <Row :gutter="16" class="block-row">
            <Col :xs="24" :md="12" class="card-col">
                <Card title="最新动态" class="fill-card">
                    <Timeline>
                        <TimelineItem v-for="item in activityData" :key="item.time">
                            <div class="activity-title">{{ item.title }}</div>
                            <div class="activity-meta">{{ item.time }}</div>
                        </TimelineItem>
                    </Timeline>
                </Card>
            </Col>
            <Col :xs="24" :md="12" class="card-col">
                <Card title="领养状态概览" class="fill-card">
                    <div class="status-grid">
                        <div class="status-item">
                            <span>已领养</span>
                            <strong>{{ statusOverview.adopted }}</strong>
                        </div>
                        <div class="status-item">
                            <span>可领养</span>
                            <strong>{{ statusOverview.available }}</strong>
                        </div>
                    </div>
                    <div class="pet-type-overview">
                        <div class="overview-title">猫狗数量占比</div>
                        <div class="type-row">
                            <span>狗</span>
                            <div class="type-progress">
                                <div class="type-progress-inner dog" :style="{ width: petTypeStats.dogPercent + '%' }"></div>
                            </div>
                            <strong>{{ petTypeStats.dog }}只</strong>
                        </div>
                        <div class="type-row">
                            <span>猫</span>
                            <div class="type-progress">
                                <div class="type-progress-inner cat" :style="{ width: petTypeStats.catPercent + '%' }"></div>
                            </div>
                            <strong>{{ petTypeStats.cat }}只</strong>
                        </div>
                        <div class="type-summary">共 {{ petTypeStats.total }} 只在册宠物</div>
                    </div>
                    <div class="approval-overview">
                        <div class="overview-title">审核通过率</div>
                        <div class="approval-main">
                            <strong>{{ approvalStats.rate }}%</strong>
                            <span>已通过 {{ approvalStats.approved }} / 已审核 {{ approvalStats.reviewed }}</span>
                        </div>
                        <div class="approval-progress">
                            <div class="approval-progress-inner" :style="{ width: approvalStats.rate + '%' }"></div>
                        </div>
                        <div class="type-summary">仅统计已通过和已拒绝申请，不包含待审核</div>
                    </div>
                </Card>
            </Col>
        </Row>
    </div>
</template>
<script>
    import { DashboardSummary } from '@/api/dashboard';
    import { PetList } from '@/api/pet';
    import { AdoptionList } from '@/api/adoption';

    export default {
        name: 'dashboard-console',
        data () {
            return {
                stats: {
                    todayNewPets: 0,
                    pendingAdoptions: 0,
                    monthApprovedAdoptions: 0,
                    monthApprovalRate: 0,
                    totalPets: 0,
                    availablePets: 0
                },
                reminders: {
                    overduePending: 0,
                    missingMainImage: 0,
                    peakTime: '-'
                },
                notice: {
                    content: '',
                    updatedBy: '',
                    updatedAt: ''
                },
                pendingColumns: [
                    { title: '申请人', key: 'name', minWidth: 80 },
                    { title: '电话', key: 'phone', minWidth: 110 },
                    { title: '宠物', key: 'pet', minWidth: 80 },
                    { title: '提交时间', key: 'time', minWidth: 140 }
                ],
                pendingData: [],
                trendData: [],
                cityData: [],
                activityData: [],
                statusOverview: {
                    adopted: 0,
                    available: 0,
                    unavailable: 0,
                    needInfo: 0
                },
                petTypeStats: {
                    dog: 0,
                    cat: 0,
                    total: 0,
                    dogPercent: 0,
                    catPercent: 0
                },
                approvalStats: {
                    approved: 0,
                    rejected: 0,
                    reviewed: 0,
                    rate: 0
                }
            }
        },
        mounted () {
            this.fetchSummary();
            this.fetchPetTypeStats();
            this.fetchApprovalStats();
        },
        methods: {
            fetchSummary () {
                DashboardSummary()
                    .then(res => {
                        if (!res) return;
                        this.stats = res.stats || this.stats;
                        this.reminders = res.reminders || this.reminders;
                        this.notice = res.notice || this.notice;
                        this.pendingData = res.pending || [];
                        this.trendData = res.trend || [];
                        this.cityData = res.cities || [];
                        this.activityData = res.activity || [];
                        this.statusOverview = res.statusOverview || this.statusOverview;
                    })
                    .catch(() => {});
            },
            fetchApprovalStats () {
                AdoptionList()
                    .then(res => {
                        const list = Array.isArray(res) ? res : [];
                        const approved = list.filter(item => item.status === 1).length;
                        const rejected = list.filter(item => item.status === 2).length;
                        const reviewed = approved + rejected;
                        this.approvalStats = {
                            approved,
                            rejected,
                            reviewed,
                            rate: reviewed ? Math.round((approved / reviewed) * 100) : 0
                        };
                    })
                    .catch(() => {});
            },
            fetchPetTypeStats () {
                PetList()
                    .then(res => {
                        const list = Array.isArray(res) ? res : [];
                        const dog = list.filter(item => this.normalizePetType(item.type) === 'DOG').length;
                        const cat = list.filter(item => this.normalizePetType(item.type) === 'CAT').length;
                        const total = dog + cat;
                        this.petTypeStats = {
                            dog,
                            cat,
                            total,
                            dogPercent: total ? Math.round((dog / total) * 100) : 0,
                            catPercent: total ? Math.round((cat / total) * 100) : 0
                        };
                    })
                    .catch(() => {});
            },
            normalizePetType (value) {
                const text = String(value || '').toUpperCase();
                if (text === 'DOG' || text.includes('狗') || text.includes('犬')) return 'DOG';
                if (text === 'CAT' || text.includes('猫')) return 'CAT';
                return '';
            },
            goToAdoptionReviewList () {
                this.$router.push({ name: 'adopt-review-list' });
            }
        }
    }
</script>
<style scoped>
.dashboard-console {
    padding: 8px;
}
.card-col {
    display: flex;
}
:deep(.fill-card) {
    width: 100%;
    height: 100%;
}
:deep(.fill-card .ivu-card-body) {
    height: 100%;
    display: flex;
    flex-direction: column;
}
.block-row {
    margin-top: 16px;
}
.stat-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 8px;
    min-height: 86px;
}
.stat-title {
    color: #6b7280;
    font-size: 13px;
}
.stat-value {
    font-size: 26px;
    font-weight: 700;
    color: #1f2937;
}
.stat-meta {
    color: #9ca3af;
    font-size: 12px;
}
.table-footer {
    margin-top: auto;
    padding-top: 12px;
    margin-bottom: 20px;
    text-align: right;
    position: relative;
    z-index: 1;
}

:deep(.pending-card .ivu-card-body) {
    padding-bottom: 32px;
}
.side-stack {
    flex-direction: column;
}
.reminder-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    color: #4b5563;
}
.stack-card {
    margin-top: 16px;
}
.notice {
    color: #374151;
    line-height: 1.6;
}
.notice-meta {
    color: #9ca3af;
    margin-top: 8px;
    font-size: 12px;
}
.trend {
    display: grid;
    gap: 12px;
}
.trend-item {
    display: grid;
    grid-template-columns: 60px 1fr;
    align-items: center;
    gap: 10px;
}
.trend-label {
    color: #6b7280;
    font-size: 12px;
}
.trend-bar {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
}
.trend-count {
    color: #9ca3af;
    font-size: 12px;
}
.city-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
}
.city-list li {
    display: flex;
    justify-content: space-between;
    color: #4b5563;
}
.city-count {
    font-weight: 600;
}
.activity-title {
    color: #374151;
}
.activity-meta {
    color: #9ca3af;
    font-size: 12px;
    margin-top: 4px;
}
.status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}
.status-item {
    background: #f9fafb;
    border-radius: 10px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.status-item span {
    color: #6b7280;
    font-size: 12px;
}
.status-item strong {
    font-size: 20px;
    color: #111827;
}
.pet-type-overview {
    margin-top: 18px;
    border-top: 1px solid #eef0f3;
    padding-top: 16px;
}
.approval-overview {
    margin-top: 18px;
    border-top: 1px solid #eef0f3;
    padding-top: 16px;
}
.overview-title {
    color: #374151;
    font-weight: 600;
    margin-bottom: 12px;
}
.type-row {
    display: grid;
    grid-template-columns: 32px 1fr 48px;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: #4b5563;
}
.type-progress {
    height: 10px;
    background: #f3f4f6;
    border-radius: 999px;
    overflow: hidden;
}
.type-progress-inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.3s ease;
}
.type-progress-inner.dog {
    background: #f59eaa;
}
.type-progress-inner.cat {
    background: #60a5fa;
}
.type-row strong {
    color: #374151;
    font-size: 13px;
    text-align: right;
}
.type-summary {
    color: #9ca3af;
    font-size: 12px;
}
.approval-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}
.approval-main strong {
    color: #111827;
    font-size: 28px;
}
.approval-main span {
    color: #6b7280;
    font-size: 12px;
}
.approval-progress {
    height: 10px;
    background: #f3f4f6;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 8px;
}
.approval-progress-inner {
    height: 100%;
    border-radius: 999px;
    background: #34d399;
    transition: width 0.3s ease;
}
@media (max-width: 768px) {
    .card-col {
        display: block;
    }
}
</style>
