<template>
  <div class="user-manager">
    <v-card flat>
      <!-- Search and Filters -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search users"
              hint="Search by nickname, email, or userId"
              persistent-hint
              clearable
              outlined
              density="compact"
              @update:model-value="debouncedSearch"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterTier"
              :items="tierOptions"
              label="Subscription Tier"
              outlined
              density="compact"
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="User Status"
              outlined
              density="compact"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>

      <!-- Users Table -->
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="users"
        :items-length="totalUsers"
        :loading="loading"
        :page="page"
        item-value="userId"
        @update:page="onPageChange"
        @update:items-per-page="onItemsPerPageChange"
        @click:row="showUserDetails"
        class="user-table"
        hover
      >
        <!-- Avatar Column -->
        <template v-slot:item.avatar="{ item }">
          <v-avatar size="40" class="my-2">
            <v-img v-if="item.personalAvatar || item.miniAvatar" :src="item.personalAvatar || item.miniAvatar" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
        </template>

        <!-- Nickname Column -->
        <template v-slot:item.nickname="{ item }">
          <div class="d-flex align-center">
            <span>{{ item.nickname || 'Anonymous' }}</span>
            <v-chip v-if="item.isAdmin" size="x-small" color="error" class="ml-2">Admin</v-chip>
          </div>
        </template>

        <!-- Email Column -->
        <template v-slot:item.email="{ item }">
          <span class="text-caption">{{ item.email || 'N/A' }}</span>
        </template>

        <!-- Subscription Column -->
        <template v-slot:item.subscriptionTier="{ item }">
          <v-chip :color="getTierColor(item.subscriptionTier)" size="small">
            {{ item.subscriptionTier || 'free' }}
          </v-chip>
        </template>

        <!-- Status Column -->
        <template v-slot:item.isAnonymous="{ item }">
          <v-chip :color="item.isAnonymous ? 'grey' : 'success'" size="small">
            {{ item.isAnonymous ? 'Anonymous' : 'Registered' }}
          </v-chip>
        </template>

        <!-- Online Status Column -->
        <template v-slot:item.onlineState="{ item }">
          <v-chip :color="item.onlineState ? 'success' : 'grey'" size="small">
            <v-icon size="x-small" class="mr-1">{{ item.onlineState ? 'mdi-circle' : 'mdi-circle-outline' }}</v-icon>
            {{ item.onlineState ? 'Online' : 'Offline' }}
          </v-chip>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-dots-vertical" size="small" variant="text" @click.stop="openActionsMenu(item)" />
        </template>

        <!-- Loading slot -->
        <template v-slot:loading>
          <v-skeleton-loader type="table-row@10" />
        </template>
      </v-data-table-server>
    </v-card>

    <!-- User Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedUser">
        <v-card-title class="d-flex align-center">
          <v-avatar size="48" class="mr-3">
            <v-img v-if="selectedUser.personalAvatar || selectedUser.miniAvatar"
              :src="selectedUser.personalAvatar || selectedUser.miniAvatar" />
            <v-icon v-else>mdi-account-circle</v-icon>
          </v-avatar>
          <div>
            <div>{{ selectedUser.nickname || 'Anonymous User' }}</div>
            <div class="text-caption text-grey">{{ selectedUser.userId }}</div>
          </div>
          <v-spacer />
          <v-btn icon="mdi-close" @click="detailsDialog = false" />
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <!-- User Info -->
            <v-col cols="12" md="6">
              <h4 class="mb-3">User Information</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Email</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.email || 'N/A' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Level</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.level || 'L1' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Age</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.age || 'Not set' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Account Type</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip size="small" :color="selectedUser.isAnonymous ? 'grey' : 'success'">
                      {{ selectedUser.isAnonymous ? 'Anonymous' : 'Registered' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Admin Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip size="small" :color="selectedUser.isAdmin ? 'error' : 'grey'">
                      {{ selectedUser.isAdmin ? 'Admin' : 'Regular User' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>

            <!-- Analytics -->
            <v-col cols="12" md="6">
              <h4 class="mb-3">Analytics</h4>
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Subscription Tier</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip size="small" :color="getTierColor(selectedUser.subscriptionTier)">
                      {{ selectedUser.subscriptionTier || 'free' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Owned Rooms</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.ownedRooms?.length || 0 }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Favorite Rooms</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedUser.favoriteRooms?.length || 0 }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Created At</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedUser.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Last Online</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedUser.lastOnline) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Total Online Time</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDuration(selectedUser.totalOnlineTime) }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-btn color="primary" variant="text" @click="viewUserProfile">
            <v-icon class="mr-2">mdi-account</v-icon>
            View Profile
          </v-btn>
          <v-spacer />
          <v-btn color="warning" variant="outlined" @click="showRecreateDialog">
            <v-icon class="mr-2">mdi-account-reactivate</v-icon>
            Recreate User
          </v-btn>
          <v-btn color="error" variant="outlined" @click="showDeleteDialog">
            <v-icon class="mr-2">mdi-delete</v-icon>
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Recreate User Dialog -->
    <v-dialog v-model="recreateDialog" max-width="500">
      <v-card>
        <v-card-title>Recreate User in Auth</v-card-title>
        <v-card-text>
          <p class="mb-3">This will recreate the user in Firebase Authentication using their existing database data.</p>
          <v-text-field
            v-model="recreateEmail"
            label="Email Address"
            hint="Required to recreate the user"
            persistent-hint
            outlined
            density="compact"
          />
          <v-alert type="info" class="mt-3" density="compact">
            The user will be able to login with this email and reset their password.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="recreateDialog = false">Cancel</v-btn>
          <v-btn color="warning" :loading="recreating" :disabled="!recreateEmail" @click="recreateUser">
            Recreate
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this user account? This action cannot be undone.
          <v-alert type="warning" class="mt-3" density="compact">
            This will trigger the account deletion process.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'vue-router';

const router = useRouter();

// State
const loading = ref(false);
const users = ref([]);
const totalUsers = ref(0);
const page = ref(1);
const itemsPerPage = ref(20);
const search = ref('');
const filterTier = ref(null);
const filterStatus = ref(null);

// Dialog states
const detailsDialog = ref(false);
const recreateDialog = ref(false);
const deleteDialog = ref(false);
const selectedUser = ref(null);
const recreateEmail = ref('');
const recreating = ref(false);
const deleting = ref(false);

// Snackbar
const snackbar = ref(false);
const snackbarMessage = ref('');
const snackbarColor = ref('success');

// Table configuration
const headers = [
  { title: '', key: 'avatar', sortable: false, width: '60px' },
  { title: 'Nickname', key: 'nickname', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Subscription', key: 'subscriptionTier', sortable: true },
  { title: 'Type', key: 'isAnonymous', sortable: true },
  { title: 'Status', key: 'onlineState', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

const tierOptions = [
  { title: 'All Tiers', value: null },
  { title: 'Free', value: 'free' },
  { title: 'Landlord', value: 'landlord' },
  { title: 'Creator', value: 'creator' },
];

const statusOptions = [
  { title: 'All Users', value: null },
  { title: 'Registered', value: 'registered' },
  { title: 'Anonymous', value: 'anonymous' },
  { title: 'Online', value: 'online' },
  { title: 'Offline', value: 'offline' },
  { title: 'Admin', value: 'admin' },
];

// Methods
const loadUsers = async () => {
  loading.value = true;
  try {
    // Get Firebase Auth token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();

    // Build query parameters
    const params = new URLSearchParams({
      page: page.value.toString(),
      limit: itemsPerPage.value.toString(),
    });

    if (search.value) {
      params.append('search', search.value);
    }
    if (filterTier.value) {
      params.append('tier', filterTier.value);
    }
    if (filterStatus.value) {
      params.append('status', filterStatus.value);
    }

    // Call Cloud Function
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/getAllUsers';
    const response = await fetch(`${functionUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const result = await response.json();

    if (result.success) {
      users.value = result.data;
      totalUsers.value = result.pagination.total;
    } else {
      throw new Error(result.error || 'Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    showSnackbar(error.message || 'Failed to load users', 'error');
    users.value = [];
    totalUsers.value = 0;
  } finally {
    loading.value = false;
  }
};

// Debounced search
let searchTimeout;
const debouncedSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    loadUsers();
  }, 500);
};

const onPageChange = (newPage) => {
  page.value = newPage;
  loadUsers();
};

const onItemsPerPageChange = (newItemsPerPage) => {
  itemsPerPage.value = newItemsPerPage;
  page.value = 1;
  loadUsers();
};

const showUserDetails = (event, { item }) => {
  selectedUser.value = item;
  detailsDialog.value = true;
};

const openActionsMenu = (user) => {
  selectedUser.value = user;
  detailsDialog.value = true;
};

const showRecreateDialog = () => {
  recreateEmail.value = selectedUser.value?.email || '';
  recreateDialog.value = true;
};

const showDeleteDialog = () => {
  deleteDialog.value = true;
};

const recreateUser = async () => {
  if (!selectedUser.value || !recreateEmail.value) return;

  recreating.value = true;
  try {
    const response = await fetch(
      'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/recreateUser',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.value.userId,
          email: recreateEmail.value,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      showSnackbar('User recreated successfully', 'success');
      recreateDialog.value = false;
      detailsDialog.value = false;
    } else {
      showSnackbar(result.error || 'Failed to recreate user', 'error');
    }
  } catch (error) {
    console.error('Error recreating user:', error);
    showSnackbar('Failed to recreate user', 'error');
  } finally {
    recreating.value = false;
  }
};

const deleteUser = async () => {
  if (!selectedUser.value) return;

  deleting.value = true;
  try {
    // TODO: Implement user deletion
    // This should call the requestAccountDeletion cloud function
    showSnackbar('Delete user functionality will be implemented', 'warning');
    deleteDialog.value = false;
    detailsDialog.value = false;
  } catch (error) {
    console.error('Error deleting user:', error);
    showSnackbar('Failed to delete user', 'error');
  } finally {
    deleting.value = false;
  }
};

const viewUserProfile = () => {
  // TODO: Navigate to user profile or open in new tab
  console.log('View profile for user:', selectedUser.value?.userId);
  showSnackbar('View profile functionality will be implemented', 'info');
};

const getTierColor = (tier) => {
  switch (tier) {
    case 'creator': return 'purple';
    case 'landlord': return 'primary';
    default: return 'grey';
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return '0 minutes';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} minutes`;
};

const showSnackbar = (message, color = 'success') => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
};

// Watchers
watch([filterTier, filterStatus], () => {
  page.value = 1;
  loadUsers();
});

// Lifecycle
onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.user-manager {
  width: 100%;
}

.user-table {
  :deep(.v-data-table__tr) {
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.05);
    }
  }
}

:deep(.v-data-table) {
  background-color: transparent;
}
</style>
