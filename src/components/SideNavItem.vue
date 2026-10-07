<template>
  <div>
    <v-list-item
      v-if="!isLabelOnly"
      :class="[
        'side-nav-item',
        {
          'side-nav-item--active': isCurrentPage,
          'side-nav-item--branch': !isCurrentPage && isActiveBranch,
        },
      ]"
      @click="handleItemClick"
    >
      <div class="side-nav-item__content">
        <v-icon
          v-if="item.icon"
          :icon="item.icon"
          size="28"
        />
      </div>
      <span v-if="item.name" class="side-nav-item__text">{{ item.name }}</span>

    </v-list-item>

    <div
      v-if="hasChildren"
      class="side-nav-children"
    >
      <SideNavItem
        v-for="child in item.child"
        :key="child.path || child.name"
        :item="child"
        :current-path="currentPath"
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
});

const router = useRouter();

const hasChildren = computed(() =>
  Array.isArray(props.item.child) &&
  props.item.child.length > 0
);

const isLabelOnly = computed(() =>
  hasChildren.value &&
  !props.item.path
);

const isCurrentPage = computed(() =>
  props.item.path === props.currentPath
);

const isActiveBranch = computed(() =>
  isBranchActive(props.item, props.currentPath)
);

function isBranchActive(menuItem, currentPath) {
  if (menuItem.path === currentPath) {
    return true;
  }

  if (
    !Array.isArray(menuItem.child) ||
    menuItem.child.length === 0
  ) {
    return false;
  }

  return menuItem.child.some((child) =>
    isBranchActive(child, currentPath)
  );
}

function handleItemClick() {
  if (
    props.item.path &&
    props.item.path !== props.currentPath
  ) {
    navigateTo(router, props.item.path);
  }
}
</script>

<style scoped>
.side-nav-item {
  width: 64px;
  height: 68px;
  min-height: 64px;
  margin: 0px auto;
  padding: 0px;
  border-radius: 0px;
  color: #4b5565;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: 
    background-color 0.2s ease,
    color 0.2s ease;
}

.side-nav-item__text {
  margin-left: 0px;
  font-size: 12px;
  color: inherit;
}

.side-nav-item__content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-nav-item:active {
  background-color: #ffffff;
  color: #127ab7;
}

.side-nav-item:active .side-nav-item__text {
  color: #127ab7;
}

.side-nav-item--branch {
  background-color: #fff7f2;
}

.side-nav-item--active {
  background-color: #127ab7;
  color: #ffffff;
}

.side-nav-children {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>