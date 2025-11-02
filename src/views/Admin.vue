<template>
  <div class="admin-page">
    <!-- Top Navigation -->
    <v-app-bar dense elevation="4" rounded shaped>
      <v-btn icon @click="goBack" class="back-btn">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="admin-toolbar-title">
        <v-icon class="mr-2" color="error">mdi-shield-crown</v-icon>
        Admin Dashboard
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip color="error" text-color="white" small>
        <v-icon small left>mdi-lock</v-icon>
        Admin Only
      </v-chip>
    </v-app-bar>

    <v-container fluid class="admin-container">
      <!-- Main Tabs -->
      <v-card class="admin-card themed-card" elevation="4">
        <v-tabs v-model="activeTab" bg-color="transparent" color="primary" grow>
          <v-tab value="assets">
            <v-icon class="mr-2">mdi-image-multiple</v-icon>
            Assets
          </v-tab>
          <v-tab value="users">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Users
          </v-tab>
          <v-tab value="testing">
            <v-icon class="mr-2">mdi-test-tube</v-icon>
            Testing
          </v-tab>
          <v-tab value="system">
            <v-icon class="mr-2">mdi-cog</v-icon>
            System
          </v-tab>
        </v-tabs>

        <v-divider></v-divider>

        <v-tabs-window v-model="activeTab">
          <!-- Assets Tab -->
          <v-tabs-window-item value="assets">
            <div class="tab-content">
              <AssetsManager v-if="tabsLoaded.assets" />
              <div v-else class="loading-container">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4">Loading assets manager...</p>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Users Tab -->
          <v-tabs-window-item value="users">
            <div class="tab-content">
              <UserManager v-if="tabsLoaded.users" />
              <div v-else class="loading-container">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4">Loading user manager...</p>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- Testing Tab -->
          <v-tabs-window-item value="testing">
            <div class="tab-content">
              <TestingPanel v-if="tabsLoaded.testing" />
              <div v-else class="loading-container">
                <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
                <p class="mt-4">Loading testing panel...</p>
              </div>
            </div>
          </v-tabs-window-item>

          <!-- System Tab (Placeholder for future) -->
          <v-tabs-window-item value="system">
            <div class="tab-content">
              <v-card flat>
                <v-card-text class="text-center pa-8">
                  <v-icon size="64" color="grey">mdi-cog-outline</v-icon>
                  <h3 class="mt-4 mb-2">System Settings</h3>
                  <p class="text-grey">Coming soon...</p>
                  <p class="text-caption mt-4">
                    This section will include system logs, configuration, and other admin settings.
                  </p>
                </v-card-text>
              </v-card>
            </div>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-container>
  </div>
</template>

<script setup>
import { ref, watch, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Lazy-loaded components
const AssetsManager = defineAsyncComponent(() => import('@/components/admin/AssetsManager.vue'));
const UserManager = defineAsyncComponent(() => import('@/components/admin/UserManager.vue'));
const TestingPanel = defineAsyncComponent(() => import('@/components/admin/TestingPanel.vue'));

// State
const activeTab = ref('assets');
const tabsLoaded = ref({
  assets: false,
  users: false,
  testing: false,
  system: false,
});

// Watch for tab changes and lazy load content
watch(activeTab, (newTab) => {
  if (!tabsLoaded.value[newTab]) {
    // Small delay to show loading state
    setTimeout(() => {
      tabsLoaded.value[newTab] = true;
    }, 100);
  }
});

// Load first tab on mount
setTimeout(() => {
  tabsLoaded.value.assets = true;
}, 100);

// Methods
const goBack = () => {
  router.push({ name: 'profile' });
};
</script>

<style scoped lang="scss">
.admin-page {
  min-height: 100vh;
  background: var(--background-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.admin-toolbar-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  display: flex;
  align-items: center;
}

.back-btn {
  color: var(--text-primary) !important;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.admin-card {
  border-radius: 16px !important;
  overflow: hidden;
  border: 2px solid rgba(var(--v-theme-error), 0.3) !important;
}

.tab-content {
  padding: 24px;
  min-height: 500px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--text-secondary);
}

.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .admin-container {
    padding: 16px;
  }

  .tab-content {
    padding: 16px;
  }
}
</style>
