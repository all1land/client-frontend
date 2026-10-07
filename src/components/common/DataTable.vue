<template>

    <v-data-table
      class="data-table"
      type="outlined"
      :headers="normalizedHeaders"
      :items="items"
      :item-value="itemKey"
      :items-per-page="tableItemsPerPage"
      items-per-page-text="display"
      :page="tablePage"
      :sort-by="internalSortBy"
      :search="internalSearch"
      :loading="loading"
      :loading-text="loadingText"
      :hover="hover"
      :fixed-header="fixedHeader"
      :height="height"
      :density="density"
      :show-select="showSelect"
      :return-object="returnObject"
      :no-data-text="emptyText"
      @update:page="handlePageUpdate"
      @update:items-per-page="handleItemsPerPageUpdate"
      @update:sort-by="handleSortByUpdate"
      @click:row="handleClickRow"
    >
      <template #bottom>
        <v-row no-gutters class="data-table-footer">
          <v-col class="data-table-footer__items-per-page">
            <v-col cols="auto" class="items-per-page-label">display</v-col>
            <v-select
              class="items-per-page-select"
              :model-value="internalItemsPerPage"
              :items="itemsPerPageOptions"
              density="compact"
              hide-details
              variant="outlined"
              @update:model-value="handleItemsPerPageUpdate"
            />
          </v-col>

          <v-pagination
            class="table-pagination"
            :model-value="internalPage"
            :length="paginationLength"
            :total-visible="5"
            density="comfortable"
            rounded="circle"
            active-color="#101828"
            color="#6B7280"
            prev-icon="mdi-chevron-left"
            next-icon="mdi-chevron-right"
            @update:model-value="handlePageUpdate"
          />
        </v-row>
      </template>

      <template v-for="slotName in forwardedSlotNames" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </v-data-table>
</template>

<script setup>
// ----- 선언부 ----- //
import { computed, ref, useSlots, watch } from "vue";

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: "id",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: "데이터를 불러오는 중입니다.",
  },
  emptyText: {
    type: String,
    default: "표시할 데이터가 없습니다.",
  },
  search: {
    type: String,
    default: "",
  },
  page: {
    type: Number,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  serverMode: {
    type: Boolean,
    default: false,
  },
  totalItems: {
    type: Number,
    default: null,
  },
  sortBy: {
    type: Array,
    default: () => [],
  },
  density: {
    type: String,
    default: "comfortable",
  },
  hover: {
    type: Boolean,
    default: true,
  },
  fixedHeader: {
    type: Boolean,
    default: false,
  },
  height: {
    type: [String, Number],
    default: undefined,
  },
  showSelect: {
    type: Boolean,
    default: false,
  },
  returnObject: {
    type: Boolean,
    default: false,
  },
  showToolbar: {
    type: Boolean,
    default: true,
  },
  searchable: {
    type: Boolean,
    default: true,
  },
  searchPlaceholder: {
    type: String,
    default: "검색어를 입력하세요",
  },
  showRefresh: {
    type: Boolean,
    default: false,
  },
  refreshLabel: {
    type: String,
    default: "새로고침",
  },
  title: {
    type: String,
    default: "",
  },
  subtitle: {
    type: String,
    default: "",
  },
});

const emit = defineEmits([
  "update:search",
  "update:page",
  "update:itemsPerPage",
  "update:sortBy",
  "sortChange",
  "refresh",
  "rowClick",
]);

const slots = useSlots();
const forwardedSlotNames = computed(() => {
  return Object.keys(slots).filter((name) => name !== "toolbar-actions");
});

const normalizedHeaders = computed(() => {
  return (props.headers || []).map((header) => ({
    ...header,
    title: header.title ?? header.text ?? "",
    key: header.key ?? header.value ?? "",
  }));
});

const internalSearch = ref(props.search);
const internalPage = ref(props.page);
const internalItemsPerPage = ref(props.itemsPerPage);
const internalSortBy = ref(props.sortBy);
const itemsPerPageOptions = [5, 10, 20, 50, 100];
const tableItemsPerPage = computed(() => (props.serverMode ? -1 : internalItemsPerPage.value));
const tablePage = computed(() => (props.serverMode ? 1 : internalPage.value));
const paginationLength = computed(() => {
  const perPage = Number(internalItemsPerPage.value) || 0;

  if (typeof props.totalItems === 'number' && props.totalItems >= 0 && perPage > 0) {
    return Math.max(1, Math.ceil(props.totalItems / perPage));
  }

  if (perPage <= 0) {
    return 1;
  }

  return Math.max(1, Math.ceil((props.items?.length || 0) / perPage));
});

watch(() => props.search, (value) => {
  internalSearch.value = value;
});

watch(() => props.page, (value) => {
  internalPage.value = value;
});

watch(() => props.itemsPerPage, (value) => {
  internalItemsPerPage.value = value;
});

watch(() => props.sortBy, (value) => {
  internalSortBy.value = value;
});

function handlePageUpdate(value) {
  internalPage.value = value;
  emit("update:page", value);
}

function handleItemsPerPageUpdate(value) {
  const normalizedValue = Number(value) || props.itemsPerPage;
  internalItemsPerPage.value = normalizedValue;
  emit("update:itemsPerPage", normalizedValue);
}

function handleSortByUpdate(value) {
  const firstSort = Array.isArray(value) && value.length > 0 ? value[0] : null;
  const sortKey = firstSort?.key || null;
  const sortOrder = firstSort?.order || null;

  // 헤더 화살표 UI 전환(asc/desc)이 보이도록 내부 상태는 유지
  internalSortBy.value = value;
  emit("update:sortBy", value);
  emit("sortChange", {
    key: sortKey,
    order: sortOrder,
  });
}

function handleClickRow(event, item) {
  emit("rowClick", { event, item });
}

</script>

<style scoped>
.data-table {
  width: 100%;
  border: 1px solid #E5E7EB;
  border-right: 1px solid #E5E7EB;
  border-radius: 8px;
  background-color: #FFFFFF;
  overflow: hidden;
  box-shadow: none !important;
}

.data-table :deep(.v-table) {
  box-shadow: none !important;
}

.data-table :deep(thead th) {
  background-color: #F3F4F6;
  color: #6A7282;
  font-size: 13px;
  font-weight: 700;
}

.data-table :deep(tbody td) {
  font-size: 14px;
  color: #101828;
  border-bottom: 1px solid #F3F4F6;
}

.data-table-footer {
  border-top: 1px solid #F3F4F6;
  background-color: #FFFFFF;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  column-gap: 12px;
  min-height: 56px;
}

.data-table-footer__items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  grid-column: 1;
  margin-left: 16px;
  justify-self: start;
}

.items-per-page-label {
  color: #6A7282;
  font-size: 14px;
  font-weight: 400;
}

.items-per-page-select {
  max-width: 100px;
}

.items-per-page-select :deep(.v-field) {
  box-shadow: none;
}

.items-per-page-select :deep(.v-field--focused .v-field__outline),
.items-per-page-select :deep(.v-field--variant-outlined.v-field--focused .v-field__outline) {
  --v-field-border-opacity: 1;
  color: #4A5565;
}

.items-per-page-select :deep(.v-field__input),
.items-per-page-select :deep(.v-select__selection-text) {
  font-weight: 400;
}

.table-pagination {
  grid-column: 2;
  justify-self: center;
}

.table-pagination :deep(.v-btn) {
  box-shadow: none;
  min-width: 32px;
  font-weight: 400;
}

/* .table-pagination :deep(.v-pagination__item--is-active .v-btn) {
  font-weight: 700;
} */

</style>