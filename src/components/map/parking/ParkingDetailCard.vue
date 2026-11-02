<template>
  <p v-if="props.parking?.id != null" class="pa-4">주차장 ID: {{ props.parking.id }}</p>
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

});

onUnmounted(() => {

})

// ----- 함수 정의 ----- //


</script>

<style scoped>

</style>
