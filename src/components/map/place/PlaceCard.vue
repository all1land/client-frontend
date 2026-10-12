<template>
    <v-card 
        class="meeting-card" 
        variant="outlined"
        style="cursor: pointer;"
    >
        <div class="card-title">{{ props.place.title }}</div>
        <div class="card-description | mt-2">{{ props.place.description }}</div>

        <v-row no-gutters class="pa-0 | mt-3 | mb-3">
            <v-col cols="12" class="mb-1">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-phone</v-icon>
                    <span class="description-text">{{ props.place.phone || '-' }}</span>
                </v-row>
            </v-col>
            <v-col cols="12">
                <v-row no-gutters class="align-center">
                    <v-icon color="#6A7282" size="18" class="mr-1">mdi-map-marker-outline</v-icon>
                    <span class="description-text">{{ props.place.road_name_address }}</span>
                </v-row>
            </v-col>
        </v-row>

        <v-row no-gutters class="align-center">
            <v-chip v-if="props.place.category_code === 1" size="small" variant="outline" class="category-chip" prepend-icon="mdi-coffee">일상/친목</v-chip>
            <v-chip v-if="props.place.category_code === 2" size="small" variant="outline" class="category-chip" prepend-icon="mdi-trophy">대외활동/공모전</v-chip>
            <v-chip v-if="props.place.category_code === 3" size="small" variant="outline" class="category-chip" prepend-icon="mdi-briefcase">커리어</v-chip>
            <v-chip v-if="props.place.category_code === 4" size="small" variant="outline" class="category-chip" prepend-icon="mdi-book-open-page-variant">스터디</v-chip>
            <v-chip v-if="props.place.category_code === 5" size="small" variant="outline" class="category-chip" prepend-icon="mdi-palette">취미/여가</v-chip>
            <v-chip v-if="props.place.category_code === 1" size="small" variant="outline" class="tag-chip">일상/친목</v-chip>
            <v-chip v-if="props.place.category_code === 2" size="small" variant="outline" class="tag-chip">대외활동/공모전</v-chip>
            <v-chip v-if="props.place.category_code === 3" size="small" variant="outline" class="tag-chip">커리어</v-chip>
            <v-chip v-if="props.place.category_code === 4" size="small" variant="outline" class="tag-chip">스터디</v-chip>
            <v-chip v-if="props.place.category_code === 5" size="small" variant="outline" class="tag-chip">취미/여가</v-chip>
        </v-row>
    </v-card>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"

const props = defineProps({
  place: {
    type: Object,
    required: true,
  },
});

// ----- 라이프 사이클 ----- //
onMounted(() => {

});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //




</script>

<style scoped>
.header-box {
    background-color: #FFFFFF;
}

.meeting-card {
    margin-bottom: 8px;
    border: 0px solid #FFFFFF;
    background-color: #FFFFFF;
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

.status-chip-recruiting {
    background-color: #FEF9C2 !important;
    color: #A65F00 !important;
}

.status-chip-applied {
    background-color: #E6F0FF !important;
    color: #127AB7 !important;
}

.status-chip-completed {
    background-color: #F3F4F6 !important;
    color: #4A5565 !important;
}

.status-chip-ongoing {
    background-color: #D4F5E9 !important;
    color: #0D9F6E !important;
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

.apply-chip {
    font-weight: 400;
    font-size: 13px;
    letter-spacing: -0.08px;
    padding: 4px 8px;
    border-radius: 12px;
    border: 0.7px solid #E5E7EB;
    background-color: #FFFFFF;
    color: #191F28;
}

.cancel-chip {
    font-weight: 400;
    font-size: 13px;
    letter-spacing: -0.08px;
    padding: 4px 8px;
    border-radius: 12px;
    border: 0.7px solid #E5E7EB;
    background-color: #FFFFFF;
    color: #191F28;
}

.accepted-chip {
    font-weight: 400;
    font-size: 13px;
    letter-spacing: -0.08px;
    padding: 4px 8px;
    border-radius: 12px;
    border: 0.7px solid #FF6129;
    background-color: #FFF5F0;
    color: #FF6129;
}
</style>