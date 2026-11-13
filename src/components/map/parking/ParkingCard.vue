<template>
    <v-card 
        class="parking-card"
        :class="{ 'parking-card--selected': props.selected }"
        variant="outlined"
        tabindex="0"
        @click="handleEvent('click')"
        @keydown.enter.self.prevent="handleEvent('click')"
        @keydown.space.self.prevent="handleEvent('click')"
    >

        <!-- hover 시 나타나는 주차 버튼 -->
        <v-chip
            class="arrive-chip"
            variant="outlined" density="comfortable" rounded="circle" base-color="#127ab7" color="#127ab7"
            aria-label="이 주차장으로 선택"
            @click.stop="handleEvent('select')"
        >
            주차
        </v-chip>

        <!-- 헤더 -->
        <v-row no-gutters class="align-center | header-row">
            <div class="card-title">{{ props.parking.address }}</div>
            <div class="ml-2 | category-box">{{ categoryName }}</div>
            <div class="ml-1 | category-box">{{ parkingTypeName }}</div>
        </v-row>

        <!-- 전화 / 주소 -->
        <v-row no-gutters class="pa-0 | mt-1">
            <v-col cols="12" class="info-row">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                <span class="description-text">{{ props.parking.phone || '-' }}</span>
            </v-col>
            <v-col cols="12" class="info-row">
                <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                <span class="description-text">{{ props.parking.roadNameAddress || props.parking.lotNumberAddress || '-' }}</span>
            </v-col>
        </v-row>

        <!-- 거리 / 주차면 -->
        <v-row no-gutters class="align-center | mt-1">
            <div class="card-description">도착지로부터 {{ props.parking.description || '조회결과없음' }}</div>
            <div class="mx-1 | card-description">|</div>
            <div class="card-description">주차면: {{ props.parking.totalSpaces || 0 }}</div>
        </v-row>
    </v-card>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, ref, computed, inject } from "vue";
import * as HttpHandler from '@/common/HttpHandler.js';

const props = defineProps({
    parking: {
        type: Object,
        required: true,
    },
    selected: {
        type: Boolean,
        default: false,
    },
});
const emit = defineEmits(["select", "click"]);
const focusMapLocation = inject('focusMapLocation', null);

const parkingCategories = ref([]);
const parkingTypes = ref([]);
const categoryName = computed(() => {
    const code = props.parking?.categoryCode || props.parking?.category;
    return parkingCategories.value.find((item) => item.code === code)?.name || code || '주차장';
});
const parkingTypeName = computed(() => {
    const code = props.parking?.parkingTypeCode || props.parking?.parkingType;
    return parkingTypes.value.find((item) => item.code === code)?.name || code || '';
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
    fetchParkingCategory();
    fetchParkingType();
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

// 버튼 클릭 이벤트 핸들러
function handleEvent(action) {
    switch (action) {
        case 'click':
            emit('click', props.parking);
            focusMapLocation?.(props.parking, 'parking');
            break;

        case 'select':
            emit('select', props.parking);
            break;

        default:
            console.error('알 수 없는 액션 타입:', action);
    }
}
</script>

<style scoped>
.parking-card {
    padding: 12px;
    border: 0px solid #FFFFFF;
    border-radius: 0px;
    background-color: #FFFFFF;
    cursor: pointer;
}

.parking-card:hover,
.parking-card--selected {
    background-color: #F3F4F6;
}

/* 우측 '주차' 버튼 영역만큼 비워서 텍스트와 겹치지 않게 */
.header-row {
    padding-right: 44px;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #127ab7;
}

.category-box {
    color: #8B95A1;
    font-size: 16px;
    text-align: center;
}

.info-row {
    display: flex;
    align-items: center;
}

.description-text {
    font-size: 14px;
    color: #364153;
}

.card-description {
    font-size: 14px;
    color: #8B95A1;
}

/* ----- 도착 버튼 ----- */
.arrive-chip {
    background-color: #FFFFFF;
    position: absolute;
    top: 32px;
    right: 8px;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 2;

    /* 기본은 숨김 */
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;

    height: 36px !important;
    width: 36px !important;
    align-items: center;
    justify-content: center;
}

.parking-card:hover .arrive-chip,
.parking-card:focus-within .arrive-chip {
    opacity: 1;
    pointer-events: auto;
}
</style>