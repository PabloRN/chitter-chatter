<template>
  <v-menu offset-y z-index="99999">
    <template v-slot:activator="{ props }">
      <v-btn icon v-bind="props" class="profile-menu-btn">
        <v-avatar size="42" class="profile-avatar">
          <v-img v-if="userAvatar" :src="userAvatar" />
          <v-icon v-else>mdi-account-circle</v-icon>
        </v-avatar>
      </v-btn>
    </template>

    <v-list class="profile-dropdown">
      <!-- User info header (optional) -->
      <v-list-item v-if="showHeader && userName" class="user-info-header">
        <template #prepend>
          <v-avatar size="40">
            <v-img v-if="userAvatar" :src="userAvatar" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
        </template>
        <v-list-item-title class="font-weight-medium">{{ userName }}</v-list-item-title>
        <v-list-item-subtitle v-if="userEmail">{{ userEmail }}</v-list-item-subtitle>
      </v-list-item>

      <v-divider v-if="showHeader && userName"></v-divider>

      <!-- Profile -->
      <v-list-item prepend-icon="mdi-account" title="Profile" @click="handleNavigation('profile')" />

      <!-- My Rooms -->
      <v-list-item prepend-icon="mdi-home-group" title="My Rooms" @click="handleNavigation('my-rooms')" />

      <!-- Pricing -->
      <v-list-item prepend-icon="mdi-diamond-stone" title="Pricing" @click="handleNavigation('pricing')" />

      <v-divider></v-divider>

      <!-- Settings (future) -->
      <!-- <v-list-item prepend-icon="mdi-cog" title="Settings" @click="handleNavigation('settings')" /> -->

      <!-- Help & Feedback -->
      <v-list-item prepend-icon="mdi-help-circle" title="Help & Feedback" @click="handleNavigation('feedback')" />

      <!-- Admin Dashboard (Only for Admin Users) -->
      <template v-if="isAdmin">
        <v-divider></v-divider>
        <v-list-item prepend-icon="mdi-shield-crown" title="Admin Dashboard" @click="handleNavigation('admin')"
          class="admin-menu-item">
          <template #prepend>
            <v-icon color="error">mdi-shield-crown</v-icon>
          </template>
          <template #title>
            <span class="text-error font-weight-medium">Admin Dashboard</span>
          </template>
        </v-list-item>
      </template>

      <v-divider></v-divider>

      <!-- Log Out -->
      <v-list-item prepend-icon="mdi-logout" title="Log Out" @click="handleNavigation('logout')" class="logout-item">
        <template #prepend>
          <v-icon color="red">mdi-logout</v-icon>
        </template>
        <template #title>
          <span class="text-red">Log Out</span>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';

// Props
const props = defineProps({
  showHeader: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['logout', 'navigate', 'feedback']);

// Composables
const router = useRouter();
const userStore = useUserStore();

// Computed
const getCurrentUser = computed(() => userStore.getCurrentUser);
const userAvatar = computed(() => getCurrentUser.value?.personalAvatar || getCurrentUser.value?.miniAvatar);
const userName = computed(() => getCurrentUser.value?.nickname || 'User');
const userEmail = computed(() => getCurrentUser.value?.email);
const isAdmin = computed(() => getCurrentUser.value?.isAdmin);

// Methods
const handleNavigation = (action) => {
  switch (action) {
    case 'profile':
      router.push({ name: 'profile' });
      break;
    case 'my-rooms':
      router.push({ name: 'profile' });
      break;
    case 'pricing':
      router.push('/pricing');
      break;
    case 'settings':
      // Future: router.push({ name: 'settings' });
      break;
    case 'feedback':
      emit('feedback');
      break;
    case 'admin':
      router.push({ name: 'admin' });
      break;
    case 'logout':
      emit('logout');
      break;
    default:
      break;
  }

  // Also emit for parent components that might want to handle these
  emit('navigate', action);
};
</script>

<style scoped>
.profile-menu-btn {
  margin-left: 8px;
}

.profile-avatar {
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: border-color 0.2s ease;
}

.profile-avatar:hover {
  border-color: rgba(255, 255, 255, 0.6);
}

.profile-dropdown {
  min-width: 220px;
}

.user-info-header {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.02);
}

.admin-menu-item:hover {
  background: rgba(244, 67, 54, 0.08);
}

.logout-item:hover {
  background: rgba(244, 67, 54, 0.08);
}

.text-red {
  color: #f44336;
}

.text-error {
  color: #f44336;
}
</style>
