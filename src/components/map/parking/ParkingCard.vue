<template>
    <v-card 
        class="parking-card"
        variant="outlined"
        style="cursor: pointer;"
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

        <div class="card-title">{{ props.parking.address }}</div>
        <div class="card-description | mt-2">{{ props.parking.description }}</div>
        <div class="card-description | mt-2">전체 주차면 수: {{ props.parking.totalSpaces }}</div>

        <v-row no-gutters class="pa-0 | mt-3 | mb-3">
            <v-col cols="12" class="mb-1">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                    <span class="description-text">{{ props.parking.phone || '-' }}</span>
                </v-row>
            </v-col>
            <v-col cols="12">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                    <span class="description-text">{{ props.parking.road_name_address }}</span>
                </v-row>
            </v-col>
        </v-row>
    </v-card>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

const props = defineProps({
  parking: {
    type: Object,
    required: true,
  }
});
const emit = defineEmits(["select"]);

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
    color: #4A5565;
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

.category-chip {
    background-color: #dbf0f8;
    border: 0.7px solid #5daedd;
    color: #127ab7;
    font-size: 12px;
    padding-left: 16px !important;
    padding-right: 12px !important;
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
    color: #4A5565;
}

.info-section span {
    font-size: 13px;
    color: #6A7282;
}
</style>