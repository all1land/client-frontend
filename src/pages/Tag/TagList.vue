<template>
    <v-container fluid>
        <v-row no-gutters class="search-row | align-item-center | justify-space-between">
            <v-col cols="auto" class="align-item-center | d-flex">
                <v-text-field
                    v-model="search.keyword"
                    placeholder="태그명 검색" 
                    class="inputbox | mr-2"
                    variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                    hide-details
                />
                <v-select
                  v-model="search.parentCode"
                  :items="parentCodeOptions"
                  item-title="label"
                  item-value="value"
                  placeholder="상위 태그 선택" 
                  class="inputbox | mr-2"
                  variant="outlined" density="compact" rounded="lg" bg-color="#ffffff" base-color="#4A5565" color="#E5E8EB"
                  hide-details
                />
            </v-col>
            <v-col cols="auto" class="align-item-center">
                <v-btn
                    @click="handleClickBtn('reset')"
                    variant="outlined"
                    class="thin-btn | outline-grey | btn-width | mr-2"
                >초기화</v-btn>
                <v-btn
                    @click="handleClickBtn('search')"
                    variant="outlined"
                    class="thin-btn | fill-grey | btn-width"
                >검색</v-btn>
            </v-col>
        </v-row>

        <v-row no-gutters class="align-item-center | justify-space-between | mt-8 | mb-2 | ml-2">
            <v-col class="search-label">
            총 <span style="color: #2563EB; font-weight: 500;">{{ totalCount }}</span>개
            </v-col>
            <v-col cols="auto" class="justify-end">
                <v-btn
                    @click="handleClickBtn('goToCreate')"
                    variant="outlined"
                    class="active-thin-btn | btn-width"
                >태그 등록</v-btn>
            </v-col>
        </v-row>

        <data-table
            :headers="headerItems"
            :items="tableItems"
            :loading="isLoading"
            :page="pageNation.current"
            :items-per-page="pageNation.limit"
            :server-mode="true"
            :total-items="totalCount"
            @update:page="handlePageChange"
            @update:itemsPerPage="handleItemsPerPageChange"
            @rowClick="handleRowClick"
        > 

          <template #item.action="{ item }">
            <v-btn
              class="detail-btn | fill-grey | mr-1"
              size="small"
              variant="outlined"
              @click.stop="handleClickBtn('goToDetail', (item?.raw ?? item)?.id)"
            >수정</v-btn>
            <v-btn
              class="detail-btn"
              size="small"
              variant="outlined"
              @click.stop="handleClickBtn('delete', (item?.raw ?? item)?.id)"
            >삭제</v-btn>
          </template>

        </data-table>

    </v-container>

  <!-- 다이얼로그 -->
  <v-dialog v-model="dialog.isActive" width="400px">
    <v-card style="padding: 16px; border-radius: 24px;">
      <v-btn 
        icon="mdi-close" variant="text" size="small"
        v-if="!dialog.isOneBtn"
        @click="dialog.isActive = false"
        style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
      />

      <v-card-title>
        <v-row no-gutters class="align-center | justify-center | mt-3"
          style="color: #364153; font-size: 18px; font-weight: 700; letter-spacing: -0.2px;"
        >
          {{ dialog.title }}
        </v-row>
      </v-card-title>

      <v-card-text style="padding: 0px; margin-bottom: 12px;">
        <v-row no-gutters
        style="justify-content: center; text-align: center; color: #6A7282; font-size: 14px; font-weight: 400; letter-spacing: -0.15px;"
        v-html="dialog.text"/>
      </v-card-text>

      <template v-slot:actions>
        <div style="display: flex; width: 100%; gap: 8px;">
          <v-btn 
            v-if="!dialog.isOneBtn"
            class="thin-btn" 
            style="border-radius: 16px; flex: 1;" 
            variant="outlined" 
            @click="dialog.isActive = false" 
            :loading="isSubmitting"
          >취소</v-btn>
          <v-btn 
            class="active-thin-btn" 
            :style="`border-radius: 16px; flex: 1; ${dialog.isOneBtn ? 'width: 100%;' : ''}`" 
            variant="outlined" 
            @click="dialog.okButton" 
            :loading="isSubmitting">
            {{ dialog.okText }}
          </v-btn>
        </div>
      </template>
    </v-card>
  </v-dialog>

  <v-dialog 
    v-if="tagDialog.isActive && tagDialog.mode === 'create'" 
    v-model="tagDialog.isActive" width="500px">
    <tag-form-create 
      @close="tagDialog.isActive = false" 
    />
  </v-dialog>
  <v-dialog v-if="tagDialog.isActive && tagDialog.mode === 'detail'" 
    v-model="tagDialog.isActive" width="500px">
    <tag-form-detail 
      :tag-id="tagDialog.tagId" 
      @close="tagDialog.isActive = false" 
    />
  </v-dialog>
</template>


<script setup>
// ----- 선언부 ----- //
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { navigateTo } from '@/common/RouterUtil.js';
import Util from '@/common/Util.js';

import DataTable from '@/components/DataTable.vue';
import TagFormCreate from '@/pages/Tag/TagFormCreate.vue';
import TagFormDetail from '@/pages/Tag/TagFormDetail.vue';

import * as HttpHandler from '@/common/HttpHandler.js';

const emit = defineEmits([
  'show-right-btn',
]);
const router = useRouter(); 
const util = Util.getInstance();

const tagDialog = ref({
  isActive: false,
  mode: 'create',
  tagId: null,
});

const search = ref({
  keyword: '',
  parentCode: null,
});

const pageNation = ref({
  current: 1,
  limit: 10,
});

const totalCount = ref(0);
const isLoading = ref(false);
const isSubmitting = ref(false);

const parentCodeOptions = ref([
  { label: '전체 태그', value: null },
]);

const headerItems = [
  { text: '태그명', value: 'tagName' },
  { text: '태그 코드', value: 'code' },
  { text: '상위 태그 코드', value: 'parentCode' },
  { text: '등록자', value: 'userId' },
  { text: '등록일', value: 'cDate' },
  { text: '수정일', value: 'uDate' },
  { text: '액션', value: 'action' },
];
const tableItems = ref([]);

const dialog = ref({
  title: '',
  text: '',
  isActive: false,
  isOneBtn: false,
  okText: '확인',
  okButton() {}
});

// ----- 라이프 사이클 ----- //
onMounted(() => {
  emit('show-right-btn');
  fetchParentCodeOptions();
  fetchListTags();
});

// ----- 함수 정의 ----- //

async function fetchListTags() {
  isLoading.value = true;

  try {
    const response = await HttpHandler.listTags({
      page: pageNation.value.current,
      limit: pageNation.value.limit,
      parentCode: search.value.parentCode,
      tagName: search.value.keyword.trim() || null,
    });

    const list = response?.data?.items || [];
    const total = response?.data?.total || 0;
    const maxPage = Math.max(1, Math.ceil(total / pageNation.value.limit));

    if (pageNation.value.current > maxPage) {
      pageNation.value.current = maxPage;
      await fetchListTags();
      return;
    }

    const mappedRows = list.map((tag = {}) => ({
      id: tag.id,
      userId: tag.userName || tag.userId || '-',
      tagName: tag.tagName || '-',
      code: tag.code || '-',
      parentCode: tag.parentCode || '-',
      cDate: util.formatUnixDateTime(tag.cDate),
      uDate: util.formatUnixDateTime(tag.uDate),
    }));

    totalCount.value = total;
    tableItems.value = mappedRows;

  } catch (error) {
    console.error('태그 목록 조회 실패:', error);
    tableItems.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

async function fetchParentCodeOptions() {
  try {
    const response = await HttpHandler.listTags({
      page: 0,
      parentCode: '',
      tagName: null,
    });

    const rootTags = response?.data?.items || [];
    const rootTagMap = new Map();

    rootTags.forEach((tag = {}) => {
      const code = tag.code;
      if (!code || rootTagMap.has(code)) {
        return;
      }

      rootTagMap.set(code, {
        code,
        tagName: tag.tagName,
      });
    });

    parentCodeOptions.value = [
      { label: '전체 태그', value: null },
      { label: 'ROOT 태그', value: "" },
      ...Array.from(rootTagMap.values()).map((tag) => ({
        label: tag.tagName || tag.code,
        value: tag.code,
      })),
    ];
  } catch (error) {
    console.error('상위 태그 옵션 조회 실패:', error);
    parentCodeOptions.value = [{ label: '전체 태그', value: null }, { label: 'ROOT 태그', value: "" }];
  }
}

async function fetchDeleteTag(value) {
  if (!value) {
    return;
  }

  dialog.value.isActive = false;
  isSubmitting.value = true;
  isLoading.value = true;

  try {
    const response = await HttpHandler.deleteTag({ id: value });
    const statusCode = response?.status?.code;
    const isDeleted = response?.data?.deleted === true;

    if (statusCode !== 'S0000' || !isDeleted) {
      throw new Error(response?.status?.msg || '태그 삭제에 실패했습니다.');
    }

    await fetchListTags();
    await fetchParentCodeOptions();

    openDialog(
      '삭제 완료',
      '태그가 삭제되었습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );
  } catch (error) {
    console.error('태그 삭제 실패:', error);  
    openDialog(
      '삭제 실패',
      error?.message || '태그 삭제 중 오류가 발생했습니다.',
      () => {
        dialog.value.isActive = false;
      },
      true,
      '확인'
    );

  } finally {
    isSubmitting.value = false;
    isLoading.value = false;
  }
}

function handleClickBtn(action, value) {
  switch (action) {
    case 'reset':
      search.value.keyword = '';
      search.value.parentCode = null;
      pageNation.value.current = 1;
      break;

    case 'search':
      pageNation.value.current = 1;
      fetchListTags();
      break;

    case 'goToCreate':
      tagDialog.value.isActive = true;
      tagDialog.value.mode = 'create';
      tagDialog.value.tagId = null;
      break;

    case 'goToDetail':
      tagDialog.value.isActive = true;
      tagDialog.value.mode = 'detail';
      tagDialog.value.tagId = value;
      break;

    case 'delete': 
      openDialog(
        '삭제 확인',
        '정말 이 태그를 삭제하시겠습니까?<br/>삭제 시 하위 태그도 함께 삭제됩니다.',
        () => {
          fetchDeleteTag(value);
        },
        false,
        '삭제'
      );
      break;

    default:
      console.error('알 수 없는 태그 액션 타입:', action);
  }
}

function handleRowClick({ item }) {
  const row = item?.raw ?? item;
  if (!row?.id) {
    return;
  }

  handleClickBtn('goToDetail', row.id);
}

function handlePageChange(nextPage) {
  pageNation.value.current = nextPage;
  fetchListTags();
}

function handleItemsPerPageChange(limit) {
  pageNation.value.limit = limit;
  pageNation.value.current = 1;
  fetchListTags();
}

function openDialog(title, text, onConfirm, isOneBtn, okText) {
  dialog.value.title = title;
  dialog.value.text = text;
  dialog.value.okButton = onConfirm;
  dialog.value.isActive = true;
  dialog.value.isOneBtn = isOneBtn || false;
  dialog.value.okText = okText || '확인';
}
</script> 

<style scoped>
.align-item-center {
  align-items: center;
}

.search-row {
    padding: 16px;
    border-radius: 10px;
    border: 0.7px solid #E5E7EB;
    background: #FFF;
}
.search-label {
    color: #4A5565;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: -0.15px;
}

.btn-width {    
    width: 80px;
}
.outline-grey {
    border: 0.7px solid #4A5565;
    color: #4A5565;
}
.fill-grey {
    color: #ffffff !important;
    background-color: #4A5565 !important;
}

/* .inputbox :deep(.v-input__details) {
  padding-top: 4px !important;
} */
.inputbox :deep(.v-input__control) {
    width: 240px !important;
}

.inputbox :deep(.v-field__input) {
    color: #364153 !important;
    font-size: 14px !important;
}

.inputbox :deep(.v-field__input::placeholder) {
    color: #364153 !important;
    font-size: 14px !important;
    opacity: 1;
}

.inputbox :deep(.v-icon) {
    color: #4A5565 !important;
    opacity: 1;
}

.detail-btn {
  padding: 4px 8px;
  align-items: center;
  border-radius: 8px;
  border: 0.7px solid #4A5565;
  color: #4A5565;
  letter-spacing: -0.15px;
  font-family: Pretendard;
  font-size: 12px;
  font-weight: 500;
}

</style>