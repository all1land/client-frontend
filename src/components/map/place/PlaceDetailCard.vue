<template>
    <v-row class="justify-start | align-center" v-if="placeDetail" no-gutters>
        <div class="title-text">{{ placeDetail?.name }}</div>
        <div class="ml-2 | category-text">{{ placeDetail.category || '주차장' }}</div>
        <div class="ml-1 | category-text">{{ placeDetail.placeType || '' }}</div>
    </v-row>

    <p v-if="props.place?.id != null">주차장 ID: {{ placeDetail }}</p>
</template>

<script setup>
// ----- 선언부 ----- //
import { onUnmounted, ref, watch } from "vue";

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

let detailRequestId = 0;
let disposed = false;

// ----- 라이프 사이클 ----- //
// 슬롯은 최초 마운트 시 place이 null일 수 있으며, 카드 선택 시 같은 컴포넌트의 ID가 바뀝니다.
watch(() => props.place?.id, (id) => fetchGetPlaceDetail(id), { immediate: true, flush: 'sync' });

onUnmounted(() => {
    disposed = true;
    detailRequestId++;
});

// ----- 함수 정의 ----- //
async function fetchGetPlaceDetail(placeLotId) {
    if (disposed) return;
    const requestId = ++detailRequestId;
    placeDetail.value = null;
    placeDetailError.value = '';
    placeDetailLoading.value = false;

    if (placeLotId == null) return;
    if (!/^\d+$/.test(String(placeLotId)) || /^0+$/.test(String(placeLotId))) {
        placeDetailError.value = '유효한 주차장 ID가 필요합니다.';
        return;
    }

    placeDetailLoading.value = true;
    try {
        const response = await HttpHandler.detailPlace({ placeLotId });

        if (disposed || requestId !== detailRequestId) return;

        if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
            throw new Error('주차장 상세 응답이 올바르지 않습니다.');
        }
        placeDetail.value = {
            ...response.data,
            category: response.data.categoryCode || '주차장',
            placeType: response.data.placeTypeCode || '',
        };
        return response;

    } catch (error) {
        if (disposed || requestId !== detailRequestId) return;
        placeDetailError.value = error.message || '주차장 상세 조회에 실패했습니다.';

    } finally {
        if (!disposed && requestId === detailRequestId) {
            placeDetailLoading.value = false;
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
