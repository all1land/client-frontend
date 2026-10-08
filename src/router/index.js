import { createRouter, createWebHistory } from 'vue-router';

/* INFO rule
 * path
    1. camelCase 로 작성
    2. 파일 path와 동일하게 작성 예) folder1/folder2/my-file
 * name
    1. 파일명 작성 -> PascalCase 사용.
 * component
    1. 파일 path 작성
 */

const routes = [
  {
    path: '/',
    redirect: '/map'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import(/* webpackChunkName: "login" */ "@/pages/Auth/Login.vue")
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import(/* webpackChunkName: "register" */ "@/pages/Auth/Register.vue")
  },
  {
    path: '/user',
    name: 'UserMenu',
    component: () => import(/* webpackChunkName: "user-menu" */ "@/pages/Auth/UserMenu.vue")
  },
  {
    path: '/map',
    component: () => import('@/pages/Map/MapView.vue'),
    name: 'Map',
    children: [
      { path: '', 
        name: 'MapHome', 
        component: () => import('@/pages/Map/MapHomePanel.vue')
      },
      {
        path: 'directions',
        name: 'MapDirections',
        component: () => import('@/pages/Map/MapDirectionsPanel.vue')
      },
      {
        path: 'settings',
        name: 'MapSettings',
        component: () => import('@/pages/Map/MapSettingsPanel.vue')
      },
    ],
  }
  
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
export { routes }