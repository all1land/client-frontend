<template>
    <v-row class="justify-start | align-center" v-if="placeDetail" no-gutters>
        <div class="title-text">{{ placeDetail?.name }}</div>
        <div class="ml-2 | category-text">{{ placeDetail.category || '장소' }}</div>
        <div class="ml-1 | category-text">{{ placeDetail.placeType || '' }}</div>
    </v-row>

    <p v-if="props.place?.id != null">장소 ID: {{ props.place.id }}</p>
</template>

<script setup>
// ----- 선언부 ----- //
import { ref, watch } from "vue";

const props = defineProps({
    place: { 
        type: Object, 
        default: null 
    },
});

const placeDetail = ref(null);

// ----- 라이프 사이클 ----- //
// 슬롯은 최초 마운트 시 place이 null일 수 있으며, 카드 선택 시 같은 컴포넌트의 ID가 바뀝니다.
watch(() => props.place?.id, (id) => setMockPlaceDetail(id), { immediate: true, flush: 'sync' });

// ----- 함수 정의 ----- //
function setMockPlaceDetail(placeLotId) {
    placeDetail.value = null;

    if (placeLotId == null) return;
    if (!/^\d+$/.test(String(placeLotId)) || /^0+$/.test(String(placeLotId))) {
        placeDetail.value = {
            id: placeLotId,
            name: 'ID 형식 오류',
            category: '목데이터',
            placeType: '',
        };
        return;
    }

    // API 연동 전까지는 ID 기반의 목데이터로 화면을 구성합니다.
    placeDetail.value = {
        id: placeLotId,
        name: `테스트 장소 ${placeLotId}`,
        category: '목데이터',
        placeType: '임시',
    };
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
