<template>
  <div>
    <div
      v-if="isLabelOnly"
      class="side-nav-label"
      :style="{ '--side-nav-level': level }"
    >
      <div class="side-nav-item__content">
        <span class="side-nav-item__title">{{ item.name }}</span>
      </div>
    </div>

    <v-list-item
      v-else
      rounded="lg"
      :class="[
        'side-nav-item',
        {
          'side-nav-item--active': isCurrentPage,
          'side-nav-item--branch': !isCurrentPage && isActiveBranch,
        },
      ]"
      :style="{ '--side-nav-level': level }"
      @click="handleItemClick"
    >
      <div class="side-nav-item__content">
        <span class="side-nav-item__title">{{ item.name }}</span>
      </div>
    </v-list-item>

    <div v-if="hasChildren" class="side-nav-children">
      <SideNavItem
        v-for="child in item.child"
        :key="child.path || child.name"
        :item="child"
        :current-path="currentPath"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { navigateTo } from '@/common/RouterUtil.js';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  currentPath: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
});

const router = useRouter();

const hasChildren = computed(() => Array.isArray(props.item.child) && props.item.child.length > 0);
const isLabelOnly = computed(() => props.level === 0 && hasChildren.value && !props.item.path);
const isCurrentPage = computed(() => props.item.path === props.currentPath);
const isActiveBranch = computed(() => isBranchActive(props.item, props.currentPath));

function isBranchActive(menuItem, currentPath) {
  if (menuItem.path === currentPath) {
    return true;
  }

  if (!Array.isArray(menuItem.child) || menuItem.child.length === 0) {
    return false;
  }

  return menuItem.child.some((child) => isBranchActive(child, currentPath));
}

function handleItemClick() {
  if (props.item.path && props.item.path !== props.currentPath) {
    navigateTo(router, props.item.path);
  }
}
</script>

<style scoped>
.side-nav-label {
  margin: 8px 0 4px;
  min-height: 24px;
  color: #6b7280;
}

.side-nav-item {
  margin-bottom: 6px;
  min-height: 44px;
  color: #4b5565;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.side-nav-item--branch {
  background-color: #fff7f2;
}

.side-nav-item--active {
  background-color: #E6F0FF;
  color: #2B7FFF;
}

.side-nav-item__content {
  width: 100%;
  display: flex;
  align-items: center;
  padding-left: calc(var(--side-nav-level) * 16px);
}

.side-nav-item__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.side-nav-label .side-nav-item__title {
  font-size: 13px;
  font-weight: 700;
}

.side-nav-children {
  margin-top: 2px;
}
</style>