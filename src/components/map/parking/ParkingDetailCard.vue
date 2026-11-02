<template>
    <v-row no-gutters>
        <v-col cols="12" class="list-header">{{ props.parking?.address }}</v-col>
    </v-row>

    <p v-if="props.parking?.id != null">주차장 ID: {{ props.parking.id }}</p>
</template>

<script setup>
// ----- 선언부 ----- //
import { onMounted, onUnmounted, ref, computed, watch} from "vue";
import { useRouter, useRoute } from "vue-router";
import { routes } from "@/router"


const props = defineProps({
    parking: { 
        type: Object, 
        default: null 
    },
});


// ----- 라이프 사이클 ----- //
onMounted(() => {
    fetchGetParkingDetail(props.parking?.id)
});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //
async function fetchGetParkingDetail(params) {
    
}

</script>

<style scoped>
.list-header {
  width: 100%;
  font-size: 18px;
  font-weight: 600;
}
</style>
