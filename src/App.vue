<template>
  <v-app class="background">
    <v-navigation-drawer
      v-if="shouldShowSideNav"
      app
      width="280"
      color="#FFFFFF"
      class="side-nav-drawer"
    >
      <v-col cols="auto" class="pl-5 | side-nav-header">
        <!-- <v-img
          src="@/assets/title.png"
          alt="TryAngle Logo"
          contain width="200"
          @click="handleClickBtn('goToHome')"
        /> -->
        study
      </v-col>

      <v-divider />

      <v-list nav density="comfortable" class="side-nav-list">
        <SideNavItem
          v-for="page in pageList"
          :key="page.path || page.name"
          :item="page"
          :current-path="currentSideNavPath"
        />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar 
      app color="#FFFFFF" flat
      v-if="showTopNav"
    >
      <v-row no-gutters class="justify-space-between | align-center | header-container">
        <template v-if="!showLeftBtn">
          <v-col cols="auto" class="pl-5">
            <span class="app-title-left">{{ currentPageCfg.name }}</span>
          </v-col>

          <v-col cols="auto" class="pr-2">
            <v-menu location="bottom end" :close-on-content-click="true">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="40"
                  rounded="circle"
                  class="profileIcon"
                >
                  <v-img
                    :src="userProfileUrl"
                    alt="Profile"
                    cover
                    width="40"
                    height="40"
                  />
                </v-btn>
              </template>

              <v-row
                no-gutters
                class="menu-container | justify-center | elevation-2"
              >
                <v-col cols="12" class="justify-start">
                  <v-btn
                    variant="text"
                    color="#364153" class="menu-btn | border-radius-top"
                    @click="handleClickBtn('goToProfile')"
                    block
                  >
                    <template v-slot:prepend>
                      <v-icon color="#364153" size="large" icon="mdi-account-outline" class="ml-1"/>
                      <v-col>프로필 편집</v-col>
                    </template>
                  </v-btn>
                </v-col>
                <v-col cols="12" class="justify-start">
                  <v-btn
                    variant="text"
                    color="#FB2C36" class="menu-btn | red-text | border-radius-bottom"
                    @click="handleClickBtn('logout')"
                    block
                  >
                    <template v-slot:prepend>
                      <v-icon color="#FB2C36" size="large" icon="mdi-logout" class="ml-1"/>
                      <v-col>로그아웃</v-col>
                    </template>
                  </v-btn>
                </v-col>
              </v-row>
            </v-menu>
          </v-col>
        </template>

        <template v-else>
          <v-col cols="auto" class="pl-2">
            <v-btn
              v-if="showLeftBtn"
              icon="mdi-chevron-left" 
              variant="text" density="comfortable"
              @click="handleClickBtn('goToBack')"
            ></v-btn>
            <div v-else style="width: 40px;"></div>
            <span class="app-title-left">{{ currentPageCfg.name }}</span>
          </v-col>

          <v-col cols="auto" class="pr-2">
            <v-menu location="bottom end" :close-on-content-click="true">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="outlined"
                  size="40"
                  rounded="circle"
                  class="profileIcon"
                >
                  <v-img
                    :src="userProfileUrl"
                    alt="Profile"
                    cover
                    width="40"
                    height="40"
                  />
                </v-btn>
              </template>


              <v-row
                no-gutters
                class="menu-container | justify-center | elevation-2"
              >
                <v-col cols="12" class="justify-start">
                  <v-btn
                    variant="text"
                    color="#364153" class="menu-btn | border-radius-top"
                    @click="handleClickBtn('goToProfile')"
                    block
                  >
                    <template v-slot:prepend>
                      <v-icon color="#364153" size="large" icon="mdi-account-outline" class="ml-1"/>
                      <v-col>프로필 편집</v-col>
                    </template>
                  </v-btn>
                </v-col>
                <v-col cols="12" class="justify-start">
                  <v-btn
                    variant="text"
                    color="#FB2C36" class="menu-btn | red-text | border-radius-bottom"
                    @click="handleClickBtn('logout')"
                    block
                  >
                    <template v-slot:prepend>
                      <v-icon color="#FB2C36" size="large" icon="mdi-logout" class="ml-1"/>
                      <v-col>로그아웃</v-col>
                    </template>
                  </v-btn>
                </v-col>
              </v-row>
            </v-menu>
          </v-col>
        </template>
      </v-row>
    </v-app-bar>

    <v-main>
      <router-view
        @hide-top-appbar="hideTopNav"
        @hide-side-appbar="hideSideNav"
        @show-left-btn="showLeftNavBtn"
        @set-page-cfg="setCurrentPageCfg"
      ></router-view>
    </v-main>
  </v-app>

  <v-dialog v-model="dialog.isActive" width="400px">
    <v-card style="padding: 24px 16px; border-radius: 24px;">
      <v-btn 
        icon="mdi-close" variant="text" size="small"
        v-if="!dialog.isOneBtn"
        @click="dialog.isActive = false"
        style="position: absolute; top: 12px; right: 12px; color: #6B7280; z-index: 10;"
      />

      <v-card-title>
        <v-row no-gutters class="align-center | justify-center | mt-3"
          style="color: #101828; font-size: 20px; font-weight: 400; letter-spacing: -0.45px;"
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
          <v-btn class="active-thin-btn" style="border-radius: 16px;" variant="outlined" @click="dialog.okButton">{{ dialog.okText }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { onMounted, ref, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { navigateTo, goBack } from '@/common/RouterUtil.js';
import SideNavItem from '@/components/SideNavItem.vue';

const router = useRouter();
const route = useRoute();

const showTopNav = ref(true);
const showSideNav = ref(true);
const currentPageCfgOverride = ref(null);
const showLeftBtn = ref(false);
const publicPages = ['/login', '/register'];

// 반응형 유저 데이터 상태 관리
const userInfo = ref(null);

const pageList = ref([
  {
    name: '데이터 플랫폼',
    child: [
      {
        page: 'MapView',
        name: '지도',
        path: '/map',
      },
      {
        page: 'ParkingLotList',
        name: '주차장 목록',
        path: '/parking',
      },
    ],
  },
]);

// 현재 페이지 설정 계산
const currentPageCfg = computed(() => {
  if (currentPageCfgOverride.value) {
    return currentPageCfgOverride.value;
  }

  const matchedPage = findPageByPath(pageList.value, route.path);

  return matchedPage || {
    name: '',
  };
});

const currentSideNavPath = computed(() => {
  return currentPageCfgOverride.value?.activePath || route.path;
});

const shouldShowSideNav = computed(() => {
  return showSideNav.value && !publicPages.includes(route.path) && pageList.value.length > 0;
});

// 유저 프로필 이미지 URL 계산 (서버 Base URL 환경변수와 결합 필요)
const userProfileUrl = computed(() => {
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL || '';
  const defaultUrl = `${baseUrl}/profiles/default.png`;

  if (!userInfo.value || !userInfo.value.filePath) return defaultUrl;
  
  return userInfo.value.filePath.startsWith('http') 
    ? userInfo.value.filePath 
    : `${baseUrl}/${userInfo.value.filePath}`;
});

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
  console.log(import.meta.env)
  
  // checkLogin();
  loadUserInfo(); // 컴포넌트 마운트 시 유저 정보 로드
});

watch(
  () => route.path,
  () => {
    showTopNav.value = true;
    showSideNav.value = true;
    showLeftBtn.value = false;
    currentPageCfgOverride.value = null;
    loadUserInfo(); // 라우트가 변경될 때 최신 상태 반영을 위해 로드
  }
);

// ----- 함수 정의 ----- //
// localStorage에서 유저 정보 파싱 함수
function loadUserInfo() {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      userInfo.value = JSON.parse(user);
    } catch (e) {
      console.error('유저 정보 파싱 에러:', e);
      userInfo.value = null;
    }
  } else {
    userInfo.value = null;
  }
}

// 로그인 체크
function checkLogin() {
  const user = localStorage.getItem('user');
  const accessToken = localStorage.getItem('accessToken');
  const isPublicPage = publicPages.includes(route.path);

  if ((!user || !accessToken) && !isPublicPage) {
    console.log('로그인 정보 없음 - 로그인 페이지로 이동');
    navigateTo(router, '/login');
  }
}

// 상단 앱 바 숨기기
function hideTopNav() {
  showTopNav.value = false;
}

// 하단 앱 바 숨기기
function hideSideNav() {
  showSideNav.value = false;
}

function showLeftNavBtn() {
  showLeftBtn.value = true;
}

function setCurrentPageCfg(pageCfg = null) {
  if (!pageCfg || typeof pageCfg !== 'object') {
    currentPageCfgOverride.value = null;
    return;
  }

  currentPageCfgOverride.value = {
    name: pageCfg.name || '',
    activePath: pageCfg.activePath || '',
    backPath: pageCfg.backPath || '',
  };
}

function findPageByPath(pages, targetPath) {
  for (const page of pages) {
    if (page.path === targetPath) {
      return page;
    }

    if (page.child?.length) {
      const matchedChild = findPageByPath(page.child, targetPath);

      if (matchedChild) {
        return matchedChild;
      }
    }
  }

  return null;
}

// 메뉴 클릭 핸들러
function handleMenuClick(action) {
  console.log('Menu Clicked:', action);
  isFabOpen.value = false; // 클릭 후 닫기
  
  // 액션에 따른 라우팅 처리 예시
  switch (action) {
    case 'create':
      navigateTo(router, '/group/create');
      break;

    case 'profile':
      navigateTo(router, '/user');
      break;

    case 'userGroup':
      navigateTo(router, '/group/user');
      break;

    case 'UserReview':
      navigateTo(router, '/review');
      break;
  }
}

// 버튼 클릭 이벤트 핸들러
function handleClickBtn(action) {
  switch (action) {
    case 'goToHome':
      navigateTo(router, '/');
      break;

    case 'logout':
      openDialog(
        '로그아웃',
        '정말 로그아웃 하시겠습니까?',
        () => {
          dialog.value.isActive = false;
          localStorage.removeItem('user'); // 로그아웃 시 클리어
          localStorage.removeItem('accessToken');
          userInfo.value = null;
          navigateTo(router, '/login');
        },
        false,
        '확인'
      );
      break;

    case 'openMyMenu':

      break;

    case 'goToBack':
      goBack(router, currentPageCfg.value?.backPath || currentPageCfg.value?.activePath || '/');
      break;

    default:
      console.error('알 수 없는 인증 액션 타입:', action);
  }
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
.side-nav-drawer {
  border-right: 1px solid #e5e7eb;
}

.side-nav-header {
  height: 64px;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: pointer;
}

.side-nav-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* 네비게이션 바 스타일 */
.app-title-left {
  font-size: 18px;
  font-weight: 700;
  color: #364153;
  letter-spacing: -0.2px;
}

.profileIcon {
  background-color: #F3F4F6;
  border: 0px;
  overflow: hidden; 
}

.floating-btn {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  width: 56px !important;
  height: 56px !important;
  border-radius: 50% !important;
  z-index: 100;
}

.menu-container {
  position: relative;
  width: 164px;
  border-radius: 16px;
  z-index: 10;
}
.menu-btn {
  min-height: 56px; 
  border: 0.7px solid #F3F4F6;
  background-color: #FFFFFF;
  color: #364153;
  
  justify-content: space-between;

  font-size: 15px;
  letter-spacing: -0.2px;

  overflow: hidden;
}

.border-radius-top {
  border-radius: 16px 16px 0px 0px;
}
.border-radius-bottom {
  border-radius: 0px 0px 16px 16px;
}
.red-text {
  color: #FB2C36;
}


</style>
