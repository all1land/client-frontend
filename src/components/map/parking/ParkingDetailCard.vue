<template>
    <div v-if="parkingDetailLoading" class="state-box">
        <v-progress-circular indeterminate size="24" width="3" color="#127ab7" />
        <span class="ml-2 | description-text">주차장 정보를 불러오는 중입니다.</span>
    </div>

    <div v-else-if="parkingDetailError" class="state-box">
        <v-icon color="#E7000B" size="18" class="mr-1">mdi-alert-circle-outline</v-icon>
        <span class="description-text">{{ parkingDetailError }}</span>
    </div>

    <div v-else-if="parkingDetail" class="detail-card">
        <!-- 헤더 -->
        <v-row class="justify-start | align-center" no-gutters>
            <div class="title-text">{{ parkingDetail.name }}</div>
            <div class="ml-2 | category-text">{{ categoryName }}</div>
            <div class="ml-1 | category-text">{{ parkingTypeName }}</div>
        </v-row>

        <!-- 연락처 / 주소 -->
        <v-row no-gutters class="mt-2">
            <v-col cols="12" class="info-row">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                <span class="description-text">{{ address }}</span>
            </v-col>
            <v-col cols="12" class="info-row">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                <a v-if="parkingDetail.phone" class="description-text | phone-link" :href="`tel:${parkingDetail.phone}`">
                    {{ parkingDetail.phone }}
                </a>
                <span v-else class="description-text">-</span>
            </v-col>
        </v-row>

        <!-- 태그 -->
        <div class="mt-3 | tag-row">
            <v-chip class="tag-chip" size="small" variant="flat">
                주차면 {{ formatNumber(parkingDetail.totalSpaces) }}면
            </v-chip>
            <v-chip class="tag-chip" size="small" variant="flat">
                {{ parkingDetail.feeInfo || '요금정보없음' }}
            </v-chip>
            <v-chip v-if="parkingDetail.disabledParkingYn === 'Y'" class="tag-chip" size="small" variant="flat">
                <v-icon size="14" class="mr-1">mdi-wheelchair-accessibility</v-icon>장애인 주차
            </v-chip>
        </div>

        <v-divider class="my-3" />

        <!-- 운영시간 -->
        <div class="section-title">운영시간</div>
        <div v-for="hour in operationHours" :key="hour.label" class="info-line">
            <span class="label-text">{{ hour.label }}</span>
            <span class="value-text">{{ hour.value }}</span>
        </div>
        <div v-if="parkingDetail.operationDays" class="mt-1 | card-description">
            운영요일: {{ parkingDetail.operationDays }}
        </div>

        <v-divider class="my-3" />

        <!-- 요금 -->
        <div class="section-title">요금</div>
        <template v-if="isFree">
            <div class="info-line">
                <span class="label-text">이용요금</span>
                <span class="value-text point">무료</span>
            </div>
        </template>
        <template v-else>
            <div class="info-line">
                <span class="label-text">기본요금</span>
                <span class="value-text">{{ formatFee(parkingDetail.baseMinutes, parkingDetail.baseFee) }}</span>
            </div>
            <div class="info-line">
                <span class="label-text">추가요금</span>
                <span class="value-text">{{ formatFee(parkingDetail.extraUnitMinutes, parkingDetail.extraUnitFee) }}</span>
            </div>
            <div class="info-line">
                <span class="label-text">일일권</span>
                <span class="value-text">{{ dailyTicketText }}</span>
            </div>
            <div class="info-line">
                <span class="label-text">월정기권</span>
                <span class="value-text">{{ parkingDetail.monthlyPassFee > 0 ? `${formatNumber(parkingDetail.monthlyPassFee)}원` : '-' }}</span>
            </div>
        </template>
        <div class="info-line">
            <span class="label-text">결제방법</span>
            <span class="value-text">{{ parkingDetail.paymentMethod || '-' }}</span>
        </div>

        <v-divider class="my-3" />

        <!-- 기타 정보 -->
        <div class="section-title">기타 정보</div>
        <div class="info-line">
            <span class="label-text">관리기관</span>
            <span class="value-text">{{ parkingDetail.managementAgency || '-' }}</span>
        </div>
        <div v-if="parkingDetail.specialNotes" class="info-line">
            <span class="label-text">특이사항</span>
            <span class="value-text">{{ parkingDetail.specialNotes }}</span>
        </div>

        <div class="mt-3 | card-description">
            제공: {{ parkingDetail.providerName || '-' }}
            <template v-if="parkingDetail.dataReferenceDate"> · 기준일 {{ parkingDetail.dataReferenceDate }}</template>
        </div>
    </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, onUnmounted, ref, watch, onMounted } from "vue";

import * as HttpHandler from '@/common/HttpHandler.js';

const props = defineProps({
    parking: { 
        type: Object, 
        default: null 
    },
});

const parkingDetail = ref(null);
const parkingDetailLoading = ref(false);
const parkingDetailError = ref('');

let detailRequestId = 0;
let disposed = false;

// ----- 화면 표시용 값 ----- //
const address = computed(() =>
    parkingDetail.value?.roadNameAddress
    || parkingDetail.value?.displayAddress
    || parkingDetail.value?.lotNumberAddress
    || '-'
);

const isFree = computed(() => parkingDetail.value?.feeInfo === '무료');

const operationHours = computed(() => {
    const d = parkingDetail.value;
    if (!d) return [];
    return [
        { label: '평일', value: formatHours(d.weekdayOpen, d.weekdayClose) },
        { label: '토요일', value: formatHours(d.saturdayOpen, d.saturdayClose) },
        { label: '공휴일', value: formatHours(d.holidayOpen, d.holidayClose) },
    ];
});

const dailyTicketText = computed(() => {
    const d = parkingDetail.value;
    if (!d || !(d.dailyTicketFee > 0)) return '-';
    const hours = d.dailyTicketHours > 0 ? `${d.dailyTicketHours}시간 ` : '';
    return `${hours}${formatNumber(d.dailyTicketFee)}원`;
});

const parkingCategories = ref([]);
const parkingTypes = ref([]);
const categoryName = computed(() => {
    const code = parkingDetail.value?.categoryCode || parkingDetail.value?.category;
    return parkingCategories.value.find((item) => item.code === code)?.name || code || '주차장';
});
const parkingTypeName = computed(() => {
    const code = parkingDetail.value?.parkingTypeCode || parkingDetail.value?.parkingType;
    return parkingTypes.value.find((item) => item.code === code)?.name || code || '';
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
    fetchParkingCategory();
    fetchParkingType();
});

watch(() => props.parking?.id, (id) => fetchGetParkingDetail(id), { immediate: true, flush: 'sync' });

onUnmounted(() => {
    disposed = true;
    detailRequestId++;
});

// ----- 함수 정의 ----- //
async function fetchParkingCategory() {
    try {
        const response = await HttpHandler.listCommonCodes('PARKING_CATEGORY', { includeInactive: false });
        parkingCategories.value = response.data;
    } catch (error) {
        console.error('주차장 분류 조회 실패:', error);
    }
}

async function fetchParkingType() {
    try {
        const response = await HttpHandler.listCommonCodes('PARKING_TYPE', { includeInactive: false });
        parkingTypes.value = response.data;
    } catch (error) {
        console.error('주차장 유형 조회 실패:', error);
    }
}


function formatNumber(value) {
    return Number(value ?? 0).toLocaleString('ko-KR');
}

function formatFee(minutes, fee) {
    if (!(fee > 0)) return '-';
    return minutes > 0 ? `${minutes}분 ${formatNumber(fee)}원` : `${formatNumber(fee)}원`;
}

// "00:00:00" ~ "23:59:00" → 24시간, 그 외 "HH:mm ~ HH:mm"
function formatHours(open, close) {
    if (!open || !close) return '-';
    const o = open.slice(0, 5);
    const c = close.slice(0, 5);
    if (o === '00:00' && (c === '23:59' || c === '24:00')) return '24시간';
    if (o === '00:00' && c === '00:00') return '휴무';
    return `${o} ~ ${c}`;
}

async function fetchGetParkingDetail(parkingLotId) {
    if (disposed) return;
    const requestId = ++detailRequestId;
    parkingDetail.value = null;
    parkingDetailError.value = '';
    parkingDetailLoading.value = false;

    if (parkingLotId == null) return;
    if (!/^\d+$/.test(String(parkingLotId)) || /^0+$/.test(String(parkingLotId))) {
        parkingDetailError.value = '유효한 주차장 ID가 필요합니다.';
        return;
    }

    parkingDetailLoading.value = true;
    try {
        const response = await HttpHandler.detailParking({ parkingLotId });

        if (disposed || requestId !== detailRequestId) return;

        if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
            throw new Error('주차장 상세 응답이 올바르지 않습니다.');
        }
        parkingDetail.value = response.data;
        return response;

    } catch (error) {
        if (disposed || requestId !== detailRequestId) return;
        parkingDetailError.value = error.message || '주차장 상세 조회에 실패했습니다.';

    } finally {
        if (!disposed && requestId === detailRequestId) {
            parkingDetailLoading.value = false;
        }
    }
}

</script>

<style scoped>
.detail-card {
    padding: 12px;
    background-color: #FFFFFF;
}

.state-box {
    display: flex;
    align-items: center;
    padding: 16px 12px;
}

.title-text {
    font-size: 18px;
    font-weight: 600;
    color: #127ab7;
}

.category-text {
    color: #8B95A1;
    font-size: 16px;
    align-items: center;
    text-align: center;
}

.info-row {
    display: flex;
    align-items: center;
    margin-top: 2px;
}

.description-text {
    font-size: 14px;
    color: #364153;
}

.phone-link {
    text-decoration: none;
}

.phone-link:hover {
    text-decoration: underline;
}

.card-description {
    font-size: 14px;
    color: #8B95A1;
}

/* ----- 태그 ----- */
.tag-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag-chip {
    background-color: #F3F4F6 !important;
    color: #4A5565 !important;
    font-size: 12px;
}

/* ----- 섹션 ----- */
.section-title {
    font-size: 15px;
    font-weight: 600;
    color: #364153;
    margin-bottom: 6px;
}

.info-line {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 3px 0;
}

.label-text {
    flex-shrink: 0;
    font-size: 14px;
    color: #6A7282;
}

.value-text {
    font-size: 14px;
    color: #364153;
    text-align: right;
    word-break: keep-all;
}

.value-text.point {
    font-weight: 600;
    color: #127ab7;
}
</style>