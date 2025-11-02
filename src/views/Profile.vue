<template>
  <div class="profile-page">
    <!-- Top Navigation -->
    <v-app-bar dense elevation="4" rounded shaped>
      <v-btn icon @click="goBack" class="back-btn">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="profile-toolbar-title">
        Profile
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Feedback button -->
      <v-btn icon class="mr-2" @click="showFeedbackDialog = true" title="Send Feedback">
        <v-icon>mdi-message-alert-outline</v-icon>
      </v-btn>

      <v-btn v-if="!isEditing" @click="isEditing = !isEditing" class="edit-btn">
        <v-icon>mdi-pencil</v-icon>
        Edit
      </v-btn>
      <v-btn v-else @click="isEditing = !isEditing" class="edit-btn">
        <v-icon>mdi-check</v-icon>
        Save
      </v-btn>

    </v-app-bar>

    <div class="profile-container">
      <!-- Profile Header -->
      <v-card class="profile-header themed-card" elevation="4">
        <div class="profile-header-content">
          <!-- Avatar Section -->
          <div class="avatar-section">
            <v-avatar size="120" class="profile-avatar-large">
              <v-img v-if="mainAvatar || getCurrentUser?.personalAvatar || getCurrentUser?.miniAvatar"
                :src="mainAvatar || getCurrentUser.personalAvatar || getCurrentUser.miniAvatar" />
              <v-icon v-else size="60">mdi-account-circle</v-icon>
            </v-avatar>
            <v-btn v-if="isEditing" fab small class="avatar-edit-btn" @click="changeAvatar">
              <v-icon>mdi-camera</v-icon>
            </v-btn>
            <!-- Hidden file input -->
            <input ref="fileInputAvatar" type="file" accept="image/*" style="display: none"
              @change="onAvatarFileChange" />
          </div>

          <!-- User Info -->
          <div class="user-info">
            <div class="user-name-section">
              <h1 v-if="!isEditing" class="user-name">
                {{ getCurrentUser?.nickname || 'Anonymous User' }}
              </h1>
              <v-text-field :disabled="nicknameCooldownMessage !== ''" v-else v-model="editedUser.nickname"
                label="Display Name" class="edit-name-field" outlined dense
                :hint="nicknameCooldownMessage || 'Choose wisely! Nickname can only be changed once a week'"
                persistent-hint />
              <v-chip :color="getCurrentUser?.onlineState ? 'success' : 'grey'" small class="status-chip">
                <v-icon small class="mr-1">
                  {{ getCurrentUser?.onlineState ? 'mdi-circle' : 'mdi-circle-outline' }}
                </v-icon>
                {{ getCurrentUser?.onlineState ? 'Online' : 'Offline' }}
              </v-chip>
            </div>

            <div class="user-stats">


              <div class="stat-item">
                <span class="stat-number">{{ getCurrentUser?.level || 'L1' }}</span>
                <span class="stat-label">Level</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number">{{ joinedDate }}</span>
                <span class="stat-label">Joined</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-number"> {{ getCurrentUser?.client ? 'Client' : 'Registered' }}</span>
                <span class="stat-label">Account Type</span>
              </div>
            </div>

            <div class="user-status">

            </div>
          </div>
        </div>
      </v-card>

      <!-- Profile Content -->
      <div class="profile-content">
        <!-- About Section -->
        <v-card class="profile-section themed-card d-block" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-account-details</v-icon>
            About Me
          </v-card-title>
          <v-card-text>
            <div class="info-row">
              <span class="info-label">Hobbies:</span>
              <div v-if="!isEditing" class="d-flex justify-end flex-wrap">
                <v-chip v-for="chip in getCurrentUser?.hobbies" class="ma-2" :color="chip.color"
                  :prepend-icon="chip.icon">
                  {{ chip.name }}
                </v-chip>
              </div>
              <v-combobox v-if="isEditing" closable-chips v-model="editedUser.selectedHobbies" :items="categories"
                item-title="name" item-value="name" multiple chips clearable :disabled="loading" label="Search & Select"
                hide-selectedHobbies>
                <!-- Chips inside the field -->
                <template v-slot:selection="{ item, index }">
                  <v-chip :prepend-icon="item.icon" :key="index" closable :disabled="loading" :color="item.color"
                    @click:close="remove(item)">
                    {{ item.name }}
                  </v-chip>
                </template>

                <!-- Dropdown item rendering -->
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-icon :icon="item.raw.icon"></v-icon>
                    </template>
                    <v-list-item-title>{{ item.name }}</v-list-item-title>
                  </v-list-item>
                </template>
              </v-combobox>
            </div>
            <div class="info-row">
              <span class="info-label">Description:</span>
              <span class="info-value description">
                <!-- Description -->
                <div v-if="!isEditing" class="d-flex justify-end flex-wrap">
                  {{ getCurrentUser?.description || 'Not specified' }}
                </div>
                <v-textarea v-else v-model="editedUser.description" :rules="descriptionRules" label="Description"
                  :disabled="!isEditing" hint="Let people know more about you" persistent-hint outlined dense
                  :counter="200" rows="3" class="mb-4" />
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Age:</span>
              <div v-if="!isEditing" class="info-value">
                {{ getCurrentUser?.age || 'Not specified' }}
              </div>
              <v-text-field :disabled="getCurrentUser?.age" v-else v-model="editedUser.age" label="Age" type="number"
                class="edit-field" outlined dense hint="Age can only be set one time" persistent-hint />
            </div>

          </v-card-text>
        </v-card>

        <!-- Subscription Section -->
        <v-card class="profile-section themed-card d-block" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-crown</v-icon>
            Subscription
          </v-card-title>
          <v-card-text>
            <div class="subscription-info">
              <!-- Current Tier -->
              <div class="subscription-tier-display">
                <div class="tier-badge-container">
                  <v-chip
                    :color="subscriptionTierColor"
                    size="large"
                    class="tier-badge"
                    prepend-icon="mdi-star-circle"
                  >
                    {{ subscriptionTierName }}
                  </v-chip>
                </div>
                <p v-if="subscriptionData.status" class="subscription-status">
                  Status: <strong>{{ subscriptionData.status }}</strong>
                  <span v-if="subscriptionData.cancelAtPeriodEnd" class="cancel-warning">
                    (Cancels on {{ formatDate(subscriptionData.currentPeriodEnd) }})
                  </span>
                </p>
                <p v-if="subscriptionData.currentPeriodEnd && !subscriptionData.cancelAtPeriodEnd" class="subscription-renewal">
                  Renews on {{ formatDate(subscriptionData.currentPeriodEnd) }}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="subscription-actions">
                <!-- Manage Subscription (for paid tiers) -->
                <v-btn
                  v-if="subscriptionData.tier !== 'free' && subscriptionData.stripeCustomerId"
                  color="primary"
                  variant="flat"
                  size="large"
                  prepend-icon="mdi-cog"
                  @click="manageSubscription"
                  :loading="loadingPortal"
                  block
                  class="mb-3"
                >
                  Manage Subscription
                </v-btn>

                <!-- Upgrade Button (for free or landlord) -->
                <v-btn
                  v-if="subscriptionData.tier === 'free' || subscriptionData.tier === 'landlord'"
                  :color="subscriptionData.tier === 'free' ? 'success' : 'purple'"
                  variant="outlined"
                  size="large"
                  :prepend-icon="subscriptionData.tier === 'free' ? 'mdi-rocket-launch' : 'mdi-arrow-up-bold'"
                  @click="goToSubscription"
                  block
                >
                  {{ subscriptionData.tier === 'free' ? 'Upgrade to Premium' : 'Upgrade to Creator' }}
                </v-btn>
              </div>

              <!-- Feature Summary -->
              <div class="feature-summary">
                <div class="feature-item-inline" v-if="subscriptionData.tier === 'free'">
                  <v-icon size="small" color="grey">mdi-home</v-icon>
                  <span>1 room</span>
                </div>
                <div class="feature-item-inline" v-else-if="subscriptionData.tier === 'landlord'">
                  <v-icon size="small" color="primary">mdi-home-group</v-icon>
                  <span>5 rooms, custom backgrounds</span>
                </div>
                <div class="feature-item-inline" v-else-if="subscriptionData.tier === 'creator'">
                  <v-icon size="small" color="purple">mdi-infinity</v-icon>
                  <span>Unlimited rooms, creator badge</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Privacy Settings Section -->
        <v-card class="profile-section themed-card d-block" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Privacy Settings
          </v-card-title>
          <v-card-text>
            <p class="privacy-subtitle mb-4">Control what information is visible to other users</p>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showAvatar ? 'success' : 'grey'">
                  {{ privacySettings.showAvatar ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Avatar</h4>
                  <p>Allow others to see your profile picture</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showAvatar" :disabled="!isEditing" color="primary" hide-details />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showNickname ? 'success' : 'grey'">
                  {{ privacySettings.showNickname ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Nickname</h4>
                  <p>Display your username to other users</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showNickname" :disabled="!isEditing" color="primary" hide-details />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showLevel ? 'success' : 'grey'">
                  {{ privacySettings.showLevel ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Level</h4>
                  <p>Let others see your experience level</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showLevel" :disabled="!isEditing" color="primary" hide-details />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showAge ? 'success' : 'grey'">
                  {{ privacySettings.showAge ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Age</h4>
                  <p>Display your age on your profile</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showAge" :disabled="!isEditing" color="primary" hide-details />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showHobbies ? 'success' : 'grey'">
                  {{ privacySettings.showHobbies ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Hobbies</h4>
                  <p>Share your interests with others</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showHobbies" :disabled="!isEditing" color="primary" hide-details />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <v-icon class="mr-2" :color="privacySettings.showDescription ? 'success' : 'grey'">
                  {{ privacySettings.showDescription ? 'mdi-eye' : 'mdi-eye-off' }}
                </v-icon>
                <div>
                  <h4>Show Description</h4>
                  <p>Allow others to read your profile description</p>
                </div>
              </div>
              <v-switch v-model="privacySettings.showDescription" :disabled="!isEditing" color="primary" hide-details />
            </div>
          </v-card-text>
        </v-card>

        <!-- Preferences Section -->
        <v-card class="profile-section themed-card d-block" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Preferences
          </v-card-title>
          <v-card-text>
            <div class="preference-item">
              <div class="preference-info">
                <h4>Notifications</h4>
                <p>Receive notifications for room activities</p>
              </div>
              <v-switch v-model="preferences.notifications" :disabled="!isEditing" color="primary" />
            </div>

            <div class="preference-item">
              <div class="preference-info">
                <h4>Auto-join favorite rooms</h4>
                <p>Automatically join your favorite rooms when available</p>
              </div>
              <v-switch v-model="preferences.autoJoinFavorites" :disabled="!isEditing" color="primary" />
            </div>
          </v-card-text>
        </v-card>

        <!-- My Rooms Section -->
        <ProfileRooms />

        <!-- Admin Dashboard Link (Only for Admin Users) -->
        <v-card v-if="getCurrentUser?.isAdmin" class="profile-section themed-card" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2" color="error">mdi-shield-crown</v-icon>
            Admin Dashboard
          </v-card-title>
          <v-card-text>
            <p class="mb-4">Access the admin dashboard to manage assets, users, and system settings.</p>
            <v-btn color="error" variant="outlined" size="large" @click="goToAdmin" block>
              <v-icon class="mr-2">mdi-cog</v-icon>
              Open Admin Dashboard
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Actions Section -->
        <v-card v-if="!getCurrentUser?.isAnonymous" class="profile-section themed-card" elevation="2">
          <v-card-title class="section-title">
            <v-icon class="mr-2">mdi-shield-account</v-icon>
            Account Actions
          </v-card-title>
          <v-card-text>
            <div class="linked-accounts">
              <template v-for="provider in availableProviders" :key="provider.id">
                <v-btn small outlined :color="linkedProviders.includes(provider.id) ? 'success' : 'primary'"
                  class="mr-2 mb-2" :disabled="linkedProviders.includes(provider.id) && linkedProviders.length === 1"
                  @click="linkedProviders.includes(provider.id) ? unlinkAccount(provider.id) : linkAccount(provider.id)">
                  <v-icon class="mr-2">{{ provider.icon }}</v-icon>
                  {{ provider.name }}
                  <v-icon v-if="linkedProviders.includes(provider.id)" class="ml-1">mdi-check</v-icon>
                </v-btn>
              </template>
            </div>
            <small v-if="linkedProviders.length === 1 && getCurrentUser?.providerData?.length === 1"
              class="text-caption">
              You must keep at least one linked account
            </small>
            <v-btn outlined color="primary" class="action-btn" @click="exportData">
              <v-icon class="mr-2">mdi-download</v-icon>
              Export My Data
            </v-btn>

            <v-btn outlined color="error" class="action-btn ml-2" @click="showDeleteDialog = true">
              <v-icon class="mr-2">mdi-delete</v-icon>
              Delete Account
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Delete Account Confirmation -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="error--text">
          Delete Account
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete your account? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteAccount">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar v-model="showSuccess" color="success" timeout="3000">
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar v-model="showError" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>

    <!-- Feedback Dialog -->
    <FeedbackDialog
      v-model="showFeedbackDialog"
      @success="handleFeedbackSuccess"
      @error="handleFeedbackError"
    />
  </div>
</template>

<script setup>
import {
  ref, computed, watch, onMounted,
} from 'vue';
import { useRouter } from 'vue-router';
import useUserStore from '@/stores/user';
import useMainStore from '@/stores/main';
import subscriptionService from '@/services/subscriptionService';
import ProfileRooms from '@/components/ProfileRooms.vue';
import FeedbackDialog from '@/components/FeedbackDialog';
import {
  getAuth, GoogleAuthProvider, EmailAuthProvider, linkWithPopup, unlink,
} from 'firebase/auth';
import { resizeImage, createPreviewURL } from '@/utils/imageUtils';
//TODO: Move to a separate file
const hobbies = [
  { name: "Football", icon: "mdi-soccer", color: "green" },
  { name: "Basketball", icon: "mdi-basketball", color: "deep-orange" },
  { name: "Gaming", icon: "mdi-gamepad-variant", color: "purple" },
  { name: "Music", icon: "mdi-music", color: "blue" },
  { name: "Reading", icon: "mdi-book-open-page-variant", color: "indigo" },
  { name: "Drawing", icon: "mdi-pencil", color: "pink" },
  { name: "Cooking", icon: "mdi-silverware-fork-knife", color: "red" },
  { name: "Traveling", icon: "mdi-airplane", color: "cyan" },
  { name: "Movies", icon: "mdi-movie-open", color: "teal" },
  { name: "Fitness", icon: "mdi-dumbbell", color: "orange" },
  { name: "Photography", icon: "mdi-camera", color: "light-blue" },
  { name: "Coding", icon: "mdi-laptop", color: "grey darken-1" },
  { name: "Anime & Manga", icon: "mdi-drama-masks", color: "deep-purple" },
  { name: "Collecting", icon: "mdi-cards-variant", color: "brown" },
  { name: "Nature", icon: "mdi-tree", color: "green darken-2" }
];
const availableProviders = [
  {
    id: 'google.com', name: 'Google', icon: 'mdi-google', provider: new GoogleAuthProvider(),
  },
  {
    id: 'yahoo.com', name: 'Yahoo', icon: 'mdi-yahoo', provider: null,
  }, // placeholder, implement OAuth if you have it
  {
    id: 'github.com', name: 'GitHub', icon: 'mdi-github', provider: null,
  }, // same
];

const router = useRouter();
const userStore = useUserStore();
const mainStore = useMainStore();

// state
const isEditing = ref(false);
const loadingPortal = ref(false);
const showDeleteDialog = ref(false);
const editedUser = ref({
  nickname: '',
  age: null,
  selectedHobbies: [],
  description: '',
});
const preferences = ref({
  notifications: true,
  autoJoinFavorites: false,
});
const privacySettings = ref({
  showAvatar: true,
  showNickname: true,
  showLevel: true,
  showAge: false,
  showHobbies: true,
  showDescription: true,
});
const mainAvatar = ref(null);
const pendingAvatar = ref(null);
const fileInputAvatar = ref(null);
const showSuccess = ref(false);
const showError = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const selectedHobbies = ref([])
const loading = ref(false)
const showFeedbackDialog = ref(false);

// computed
const categories = computed(() =>
  hobbies.filter(
    (item) => !selectedHobbies.value.find((s) => s.name === item.name)
  )
)
const getCurrentUser = computed(() => userStore.getCurrentUser);
const favoriteRoomsCount = computed(() => getCurrentUser.value?.favoriteRooms?.length || 0);
const joinedDate = computed(() => 'Dec 2024'); // TODO: fetch from user data
const linkedProviders = computed(() => userStore.linkedProviders);
const nicknameCooldownMessage = computed(() => {
  console.log(getCurrentUser.value);
  const updatedAt = getCurrentUser.value?.nickNameUpdatedAt;
  if (!updatedAt || getCurrentUser.value?.nickname === '') return ''; // never updated, no cooldown

  const now = Date.now();
  const cooldown = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const nextAllowed = updatedAt + cooldown;

  if (now >= nextAllowed) return ''; // already allowed

  const msRemaining = nextAllowed - now;
  const days = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `You can change your nickname again in ${days} day${days > 1 ? 's' : ''}`;
  } if (hours > 0) {
    return `You can change your nickname again in ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  return 'You can change your nickname again very soon';
});

// Subscription computed properties
const subscriptionData = computed(() => {
  const user = getCurrentUser.value;
  return {
    tier: user?.subscription?.tier || user?.subscriptionTier || 'free',
    status: user?.subscription?.status || 'active',
    stripeCustomerId: user?.subscription?.stripeCustomerId || null,
    currentPeriodEnd: user?.subscription?.currentPeriodEnd || null,
    cancelAtPeriodEnd: user?.subscription?.cancelAtPeriodEnd || false,
  };
});

const subscriptionTierName = computed(() => {
  const tier = subscriptionData.value.tier;
  return tier.charAt(0).toUpperCase() + tier.slice(1);
});

const subscriptionTierColor = computed(() => {
  const tier = subscriptionData.value.tier;
  if (tier === 'creator') return 'purple';
  if (tier === 'landlord') return 'primary';
  return 'grey';
});

// redirect if not authenticated
onMounted(() => {

  if (getCurrentUser.value && getCurrentUser.value?.isAnonymous) {
    console.log('Profile mounted', getCurrentUser.value.isAnonymous);
    router.push({ name: 'rooms' });
  }

  // Load privacy settings from current user
  if (getCurrentUser.value?.privacySettings) {
    privacySettings.value = { ...getCurrentUser.value.privacySettings };
  }
});

// watchers
watch(isEditing, async (newVal) => {
  if (newVal === true) {
    // Entering edit mode - load current values
    editedUser.value.nickname = getCurrentUser.value?.nickname || '';
    editedUser.value.age = getCurrentUser.value?.age || null;
    editedUser.value.selectedHobbies = getCurrentUser.value?.hobbies || [];
    editedUser.value.description = getCurrentUser.value?.description || '';

    // Load current privacy settings
    if (getCurrentUser.value?.privacySettings) {
      privacySettings.value = { ...getCurrentUser.value.privacySettings };
    }
  } else {
    // Exiting edit mode - save all changes
    await saveProfile();
  }
});
watch(getCurrentUser.value, (newVal) => {
  if (newVal && newVal.isAnonymous) {
    router.push({ name: 'rooms' });
  }
});
//rules 
const descriptionRules = [
  (v) => !v || v.length <= 200 || `Description must be less than ${200} characters`,
];

// methods

const remove = (item) => {
  selectedHobbies.value = selectedHobbies.value.filter((s) => s.name !== item.raw.name)
}


const linkAccount = async (providerId) => {
  try {
    const auth = getAuth();
    const providerObj = availableProviders.find((p) => p.id === providerId)?.provider;
    if (!providerObj) throw new Error('Provider not configured');

    const result = await linkWithPopup(auth.currentUser, providerObj);
    console.log('Linked successfully:', result);
    userStore.refreshCurrentUser();
  } catch (error) {
    console.error('Failed to link provider:', error);
  }
};

// Unlink provider
const unlinkAccount = async (providerId) => {
  try {
    const auth = getAuth();
    if (linkedProviders.value.length <= 1) {
      console.warn('Cannot unlink the last provider');
      return;
    }
    await unlink(auth.currentUser, providerId);
    console.log('Unlinked provider:', providerId);
    userStore.refreshCurrentUser();
  } catch (error) {
    console.error('Failed to unlink provider:', error);
  }
};
const goBack = () => router.go(-1);

const goToAdmin = () => {
  router.push({ name: 'admin' });
};

const saveProfile = async () => {
  try {
    if (editedUser.value.nickname !== getCurrentUser.value?.nickname) {
      await userStore.updateUserNickName(editedUser.value.nickname);
    }
    if (editedUser.value.age) {
      await userStore.updateUserAge(editedUser.value.age);
    }
    // upload avatar if pending
    if (pendingAvatar.value) {
      userStore.uploadUserPersonalAvatar(pendingAvatar.value.file);
      pendingAvatar.value = null;
    }
    if (editedUser.value.selectedHobbies.length) {
      await userStore.updateUserHobbies(editedUser.value.selectedHobbies);
    }

    await userStore.updateUserDescription(editedUser.value.description);

    // Save privacy settings
    await userStore.updatePrivacySettings(privacySettings.value);

    console.log('Profile updated successfully');
  } catch (error) {
    console.error('Error updating profile:', error);
  }
};

const changeAvatar = () => {
  fileInputAvatar.value?.click();
};

const onAvatarFileChange = async (fileOrEvent) => {
  const file = fileOrEvent?.target?.files?.[0] || fileOrEvent[0] || fileOrEvent;
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showError.value = true;
    errorMessage.value = 'Please select a valid image file';
    return;
  }
  if (file.size > 0.2 * 1024 * 1024) {
    showError.value = true;
    errorMessage.value = 'Image file is too large';
    return;
  }

  try {
    const resizedBlob = await resizeImage(file, 50, 50, true);
    const previewUrl = createPreviewURL(resizedBlob);

    pendingAvatar.value = {
      file: new File([resizedBlob], `avatar_${Date.now()}.png`, { type: 'image/png' }),
      previewUrl,
    };
    mainAvatar.value = previewUrl;

    if (fileInputAvatar.value) fileInputAvatar.value.value = '';

    showSuccess.value = true;
    successMessage.value = 'Avatar ready. Will upload on save.';
  } catch (err) {
    console.error('Error processing image:', err);
    showError.value = true;
    errorMessage.value = 'Failed to process image';
  }
};

const exportData = () => {
  console.log('Export data clicked');
};

const deleteAccount = async () => {
  try {
    showDeleteDialog.value = false;
    loading.value = true;

    const currentUser = getCurrentUser.value;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    // Get Firebase Auth token
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const idToken = await user.getIdToken();

    // Call deletion Cloud Function
    const functionUrl = 'https://us-central1-chitter-chatter-f762a.cloudfunctions.net/requestAccountDeletion';

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        userId: user.uid,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account');
    }

    const result = await response.json();

    // Handle different deletion types
    if (result.deletionType === 'instant') {
      // Instant deletion - account deleted immediately
      mainStore.setSnackbar({
        type: 'success',
        msg: result.message || 'Your account has been deleted successfully.',
      });

      // Sign out and redirect to home
      setTimeout(() => {
        userStore.userSignOut();
      }, 2000);
    } else if (result.deletionType === 'pending_review') {
      // Pending review - admin will process
      mainStore.setSnackbar({
        type: 'info',
        msg: result.message || 'Your deletion request has been submitted for review.',
      });

      // Redirect to home
      setTimeout(() => {
        router.push({ name: 'rooms' });
      }, 3000);
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: error.message || 'Failed to delete account. Please try again.',
    });
  } finally {
    loading.value = false;
  }
};

const handleFeedbackSuccess = () => {
  successMessage.value = 'Thank you for your feedback!';
  showSuccess.value = true;
};

const handleFeedbackError = (error) => {
  errorMessage.value = `Error submitting feedback: ${error}`;
  showError.value = true;
};

// Subscription methods
const manageSubscription = async () => {
  try {
    loadingPortal.value = true;
    mainStore.setSnackbar({
      type: 'info',
      msg: 'Opening Stripe Customer Portal...',
    });

    const portalUrl = await subscriptionService.createPortalSession();
    window.location.href = portalUrl;
  } catch (error) {
    console.error('Error opening portal:', error);
    mainStore.setSnackbar({
      type: 'error',
      msg: error.message || 'Failed to open subscription portal',
    });
  } finally {
    loadingPortal.value = false;
  }
};

const goToSubscription = () => {
  router.push({ name: 'pricing' });
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};
</script>
<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

.profile-page {
  min-height: 100vh;
  background: var(--background-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.profile-toolbar-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
}

.back-btn,
.edit-btn {
  color: var(--text-primary) !important;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Profile Header */
.profile-header {
  margin-bottom: 20px;
  border-radius: 16px !important;
  overflow: visible;
}

.profile-header-content {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.profile-avatar-large {
  border: 4px solid var(--card-border);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0;
  right: 0px;
  background: var(--primary) !important;
  color: white !important;
  height: 100%;
  width: 100%;
  border-radius: 50%;

  .mdi-camera::before {
    content: "\F0100";
    font-size: 34px;
    text-shadow: 3px 3px 6px black;
  }
}

.user-info {
  flex: 1;

  .user-name-section {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
  }


}

.description {
  width: 70%;
  font-size: 0.875rem;
  color: var(--text-secondary) !important;
}

.user-name {
  color: var(--text-primary);
  margin: 0 0 16px 0;
  font-weight: 600;
  font-size: 2rem;
}

.edit-name-field {
  margin-bottom: 16px;
}

.user-stats {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--card-border);
}

.status-chip {
  font-weight: 500;
}

/* Profile Content */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.profile-section {
  border-radius: 12px !important;
}

.section-title {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  font-weight: 600 !important;
  color: var(--text-primary) !important;
  font-size: 1.1rem !important;
  margin-bottom: 20px !important;
  border-bottom: 1px solid var(--card-border);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--card-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: var(--text-primary);
}

.info-value {
  color: var(--text-secondary);
  font-weight: 500;
}

.edit-field {
  max-width: 120px;
  margin-left: auto;
}

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--card-border);
}

.preference-item:last-child {
  border-bottom: none;
}

.preference-info h4 {
  margin: 0 0 4px 0;
  font-weight: 500;
  color: var(--text-primary);
}

.preference-info p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.action-btn {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  text-transform: none !important;
  border-radius: 8px !important;
  margin-bottom: 8px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }

  .profile-header-content {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .user-stats {
    justify-content: center;
  }

  .action-btn {
    width: 100%;
    margin-left: 0 !important;
    margin-bottom: 8px;
  }
}

/* Themed card overrides */
.themed-card {
  background-color: var(--card-background) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--card-border) !important;
}

.linked-accounts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Buttons for providers */
.linked-accounts .v-btn {
  border-radius: 9999px;
  /* pill shape */
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: flex-start;
  /* keep icon + text aligned */
  padding: 0.4rem 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Hover effect */
.linked-accounts .v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

/* Active (already linked) */
.linked-accounts .v-btn.success {
  background: linear-gradient(135deg, #4caf50, #43a047);
  color: white !important;
  border: none;
}

/* Unlinked (available to connect) */
.linked-accounts .v-btn.primary {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white !important;
  border: none;
}

/* Disabled state */
.linked-accounts .v-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Privacy Settings */
.privacy-subtitle {
  color: var(--text-secondary);
  font-size: 14px;
  opacity: 0.85;
}

.preference-item .preference-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preference-item .preference-info > div {
  flex: 1;
}

.preference-item h4 {
  margin-bottom: 4px;
  font-size: 16px;
  font-weight: 500;
}

.preference-item p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

/* Subscription Section */
.subscription-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.subscription-tier-display {
  text-align: center;
  padding: 16px;
  background: var(--background-secondary);
  border-radius: 12px;
}

.tier-badge-container {
  margin-bottom: 12px;
}

.tier-badge {
  font-size: 18px !important;
  font-weight: 600 !important;
  padding: 8px 20px !important;
  height: auto !important;
}

.subscription-status {
  margin: 8px 0 4px;
  font-size: 14px;
  color: var(--text-secondary);
}

.cancel-warning {
  color: #ff9800;
  font-weight: 500;
}

.subscription-renewal {
  margin: 4px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.subscription-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feature-summary {
  display: flex;
  justify-content: center;
  padding: 12px;
  background: var(--background-secondary);
  border-radius: 8px;
}

.feature-item-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-primary);
}
</style>
