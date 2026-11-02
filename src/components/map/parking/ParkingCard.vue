<template>
    <v-card 
        class="parking-card"
        variant="outlined"
        style="cursor: pointer;"
        tabindex="0"
        @click="handleEvent('click')"
        @keydown.enter.self.prevent="handleEvent('click')"
        @keydown.space.self.prevent="handleEvent('click')"
    >

        <!-- hover 시 나타나는 주차 버튼 -->
        <v-chip
            class="arrive-chip"
            variant="outlined" density="comfortable" rounded="circle" base-color="#127ab7" color="#127ab7"
            height="36" width="36"
            @click.stop="handleEvent('select')"
        >
            주차
        </v-chip>

        <v-row no-gutters class="align-center">
            <div class="card-title">{{ props.parking.address }}</div>
            <div class="ml-2 | category-box">{{ props.parking.category || '주차장' }}</div>
            <div class="ml-1 | category-box">{{ props.parking.parkingType || '' }}</div>
        </v-row>
        
        <v-row no-gutters class="pa-0 | mt-1">
            <v-col cols="12">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                    <span class="description-text">{{ props.parking.phone || '-' }}</span>
                </v-row>
            </v-col>
            <v-col cols="12">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                    <span class="description-text">{{ props.parking.roadNameAddress || props.parking.lotNumberAddress }}</span>
                </v-row>
            </v-col>
        </v-row>

            <v-row no-gutters class="align-center">
            <div class="ml-2 | card-description">도착지로부터 {{ props.parking.description || '조회결과없음' }} | </div>
            <div class="ml-1 | card-description">주차면: {{ props.parking.totalSpaces || 0 }}</div>
        </v-row>
    </v-card>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch, inject} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

const props = defineProps({
  parking: {
    type: Object,
    required: true,
  }
});
const emit = defineEmits(["select", "click"]);
const focusMapLocation = inject('focusMapLocation', null);

// ----- 라이프 사이클 ----- //
onMounted(() => {

});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //

// 버튼 클릭 이벤트 핸들러
function handleEvent(action) {
  console.log('handleEvent triggered with action:', action);
  switch (action) {
    
    case 'click':
      emit('click', props.parking);
      focusMapLocation?.(props.parking, 'parking');
      break;

    case 'select':
        emit("select", props.parking);
        break;

    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
}



</script>

<style scoped>
.header-box {
    background-color: #FFFFFF;
}

.parking-card {
    padding: 12px;
    border: 0px solid #FFFFFF;
    border-radius: 0px;
    background-color: #FFFFFF;
}

.parking-card--selected {
    background-color: #F3F4F6;
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #127ab7;
}

.card-description {
    font-size: 14px;
    color: #8B95A1;
}

/* ----- 도착 버튼 ----- */
.arrive-chip {
    background-color: #FFFFFF;
    position: absolute;
    top: 20%;
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


/* 카드 hover */
.parking-card:hover {
    background-color: #F3F4F6;
}

.parking-card:hover .arrive-chip {
    opacity: 1;
    pointer-events: auto;
}

.category-box {
    color: #8B95A1;
    font-size: 16px;
    align-items: center;
    text-align: center;
}

.tag-chip {
    background-color: #F3F4F6;
    color: #4A5565;
    font-size: 12px;
    margin-left: 8px;
    padding-left: 12px !important;
    padding-right: 12px !important;
}

.status-chip {
    height: 24px !important;
    padding: 4px 8px !important;
    font-size: 12px !important;
    font-weight: 400 !important;
    border-radius: 4px !important;
    border: none !important;
    box-shadow: none !important;
}


.categoryId-text {
    font-size: 12px;
    color: #8B95A1;
}

.people-count {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #6A7282;
}

.description-text {
    font-size: 14px;
    color: #364153;
}

.info-section span {
    font-size: 13px;
    color: #6A7282;
}
</style>