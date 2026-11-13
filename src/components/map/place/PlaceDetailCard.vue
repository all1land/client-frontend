<template>
    <div v-if="placeDetailLoading" class="state-box">
        <v-progress-circular indeterminate size="24" width="3" color="#127ab7" />
        <span class="ml-2 | description-text">장소 정보를 불러오는 중입니다.</span>
    </div>

    <div v-else-if="placeDetailError" class="state-box">
        <v-icon color="#E7000B" size="18" class="mr-1">mdi-alert-circle-outline</v-icon>
        <span class="description-text">{{ placeDetailError }}</span>
    </div>

    <div v-else-if="placeDetail" class="detail-card">
        <!-- 헤더 -->
        <v-row class="justify-start | align-center" no-gutters>
            <div class="title-text">{{ placeDetail.name }}</div>
            <div class="ml-2 | category-text">{{ categoryName }}</div>
        </v-row>

        <!-- 연락처 / 주소 -->
        <v-row no-gutters class="mt-2">
            <v-col cols="12" class="info-row | info-row--top">
                <v-icon color="#6A7282" size="18" class="mr-1 | info-icon">mdi-map-marker-outline</v-icon>
                <span class="description-text">{{ placeDetail.roadNameAddress || placeDetail.lotNumberAddress || '-' }}</span>
            </v-col>
            <v-col cols="12" class="info-row">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                <a v-if="placeDetail.phone" class="description-text | phone-link" :href="`tel:${placeDetail.phone}`">
                    {{ placeDetail.phone }}
                </a>
                <span v-else class="description-text">-</span>
            </v-col>
        </v-row>

        <v-divider class="my-3" />

        <!-- 주소 정보 -->
        <div class="section-title">주소 정보</div>
        <div class="info-line">
            <span class="label-text">도로명 주소</span>
            <span class="value-text">{{ placeDetail.roadNameAddress || '-' }}</span>
        </div>
        <div class="info-line">
            <span class="label-text">지번 주소</span>
            <span class="value-text">{{ placeDetail.lotNumberAddress || '-' }}</span>
        </div>
        <div class="info-line">
            <span class="label-text">우편번호</span>
            <span class="value-text">{{ placeDetail.zipCode || '-' }}</span>
        </div>
    </div>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, ref, watch, onUnmounted, onMounted } from "vue";

import * as HttpHandler from '@/common/HttpHandler.js';

const props = defineProps({
    place: { 
        type: Object, 
        default: null 
    },
});

const placeDetail = ref(null);
const placeDetailLoading = ref(false);
const placeDetailError = ref('');
const placeCategories = ref([]);
const categoryName = computed(() => {
    const code = placeDetail.value?.categoryCode;
    return placeCategories.value.find((item) => item.code === code)?.name || code || '장소';
});
let detailRequestId = 0;
let disposed = false;

const hasEntrance = computed(() =>
    placeDetail.value?.entranceLatitude != null && placeDetail.value?.entranceLongitude != null
);

// ----- 라이프 사이클 ----- //
onMounted(() => {
    fetchPlaceCategory();
});

// 슬롯은 최초 마운트 시 place이 null일 수 있으며, 카드 선택 시 같은 컴포넌트의 ID가 바뀝니다.
watch(() => props.place?.id ?? props.place?.poiId, (id) => fetchGetDetailPlace(id), { immediate: true, flush: 'sync' });

onUnmounted(() => {
    disposed = true;
    detailRequestId++;
});

// ----- 함수 정의 ----- //
async function fetchPlaceCategory() {
    try {
        const response = await HttpHandler.listCommonCodes('PLACE_CATEGORY', { includeInactive: false });
        placeCategories.value = response.data;
    } catch (error) {
        console.error('장소 분류 조회 실패:', error);
    }
}

function formatCoord(lat, lng) {
    if (lat == null || lng == null) return '-';
    return `${lat}, ${lng}`;
}

async function fetchGetDetailPlace(placeId) {
    if (disposed) return;
    const requestId = ++detailRequestId;
    placeDetail.value = null;
    placeDetailError.value = '';
    placeDetailLoading.value = false;
    if (placeId == null) return;

    placeDetailLoading.value = true;
    try {
        // 선택한 장소 ID로 실제 상세 정보를 조회합니다.
        const response = await HttpHandler.getDetailPlace({ placeId });
        if (disposed || requestId !== detailRequestId) return;
        if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
            throw new Error('장소 상세 응답이 올바르지 않습니다.');
        }
        placeDetail.value = response.data;
        return response;
    } catch (error) {
        if (disposed || requestId !== detailRequestId) return;
        placeDetailError.value = error.message || '장소 상세 조회에 실패했습니다.';
    } finally {
        if (!disposed && requestId === detailRequestId) placeDetailLoading.value = false;
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
    line-height: 20px;
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

.info-row--top {
    align-items: flex-start;
}

.info-icon {
    flex-shrink: 0; 
    margin-top: 1px; 
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
</style>