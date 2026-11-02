<template>
    <v-row class="justify-start | align-center" v-if="parkingDetail" no-gutters>
        <div class="title-text">{{ parkingDetail?.name }}</div>
        <div class="ml-2 | category-text">{{ parkingDetail.category || '주차장' }}</div>
        <div class="ml-1 | category-text">{{ parkingDetail.parkingType || '' }}</div>
    </v-row>

    <p v-if="props.parking?.id != null">주차장 ID: {{ parkingDetail }}</p>
</template>

<script setup>
// ----- 선언부 ----- //
import { onUnmounted, ref, watch } from "vue";

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

// ----- 라이프 사이클 ----- //
// 슬롯은 최초 마운트 시 parking이 null일 수 있으며, 카드 선택 시 같은 컴포넌트의 ID가 바뀝니다.
watch(() => props.parking?.id, (id) => fetchGetParkingDetail(id), { immediate: true, flush: 'sync' });

onUnmounted(() => {
    disposed = true;
    detailRequestId++;
});

// ----- 함수 정의 ----- //
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
        parkingDetail.value = {
            ...response.data,
            category: response.data.categoryCode || '주차장',
            parkingType: response.data.parkingTypeCode || '',
        };
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
.title-text {
  font-size: 18px;
  font-weight: 600;
}

.category-text {
    color: #8B95A1;
    font-size: 16px;
    align-items: center;
    text-align: center;
}

</style>
