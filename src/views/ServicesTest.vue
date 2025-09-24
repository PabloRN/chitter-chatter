<template>
  <div class="services-test-container">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>
              <v-icon class="mr-2">mdi-test-tube</v-icon>
              Services Testing
            </v-card-title>
            <v-card-subtitle>
              Test the refactored authentication services individually
            </v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- Auth Service Test -->
      <v-row>
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title class="text-h6">Auth Service</v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                block
                class="mb-2"
                @click="testAnonymousSignIn"
                :loading="authLoading"
              >
                Test Anonymous Sign In
              </v-btn>
              <v-btn
                color="secondary"
                block
                class="mb-2"
                @click="testSignOut"
                :loading="authLoading"
              >
                Test Sign Out
              </v-btn>
              <v-btn
                color="info"
                block
                class="mb-2"
                @click="testCurrentUser"
              >
                Get Current User
              </v-btn>
              <div v-if="authResult" class="mt-2">
                <v-alert :type="authResult.type" dense>
                  {{ authResult.message }}
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Tab Communication Service Test -->
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title class="text-h6">Tab Communication</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="testMessage"
                label="Test Message"
                outlined
                dense
                class="mb-2"
              ></v-text-field>
              <v-btn
                color="primary"
                block
                class="mb-2"
                @click="sendTestMessage"
              >
                Send Test Message
              </v-btn>
              <v-btn
                color="secondary"
                block
                class="mb-2"
                @click="testEmailStorage"
              >
                Test Email Storage
              </v-btn>
              <v-btn
                color="info"
                block
                class="mb-2"
                @click="clearTabData"
              >
                Clear Tab Data
              </v-btn>
              <div v-if="tabMessages.length > 0" class="mt-2">
                <v-alert
                  v-for="(msg, idx) in tabMessages"
                  :key="idx"
                  type="info"
                  dense
                  class="mb-1"
                >
                  {{ msg }}
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Navigation Service Test -->
        <v-col cols="12" md="4">
          <v-card class="mb-4">
            <v-card-title class="text-h6">Navigation Service</v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                block
                class="mb-2"
                @click="storeCurrentContext"
              >
                Store Current Context
              </v-btn>
              <v-btn
                color="secondary"
                block
                class="mb-2"
                @click="getStoredContext"
              >
                Get Stored Context
              </v-btn>
              <v-btn
                color="info"
                block
                class="mb-2"
                @click="testTabInfo"
              >
                Get Tab Info
              </v-btn>
              <v-btn
                color="warning"
                block
                class="mb-2"
                @click="clearStoredContext"
              >
                Clear Context
              </v-btn>
              <div v-if="navResult" class="mt-2">
                <v-alert :type="navResult.type" dense>
                  {{ navResult.message }}
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- useAuth Composable Test -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h6">useAuth Composable</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <h4>Current State:</h4>
                  <p><strong>Authenticated:</strong> {{ isAuthenticated }}</p>
                  <p><strong>Anonymous:</strong> {{ isAnonymous }}</p>
                  <p><strong>Loading:</strong> {{ isLoading }}</p>
                  <p><strong>Signing In:</strong> {{ isSigningIn }}</p>
                  <p><strong>Error:</strong> {{ error || 'None' }}</p>
                  <p><strong>Current User:</strong></p>
                  <pre v-if="currentUser" class="text-caption">{{ JSON.stringify(currentUser, null, 2) }}</pre>
                  <p v-else class="text-caption">No user</p>
                </v-col>
                <v-col cols="12" md="6">
                  <h4>Actions:</h4>
                  <v-btn
                    color="primary"
                    class="mr-2 mb-2"
                    @click="composableAnonymousSignIn"
                    :loading="isLoading"
                  >
                    Anonymous Sign In
                  </v-btn>
                  <v-btn
                    color="secondary"
                    class="mr-2 mb-2"
                    @click="composableSignOut"
                    :loading="isLoading"
                  >
                    Sign Out
                  </v-btn>
                  <v-btn
                    color="info"
                    class="mr-2 mb-2"
                    @click="clearError"
                  >
                    Clear Error
                  </v-btn>
                  <v-btn
                    color="warning"
                    class="mr-2 mb-2"
                    @click="refreshUser"
                  >
                    Refresh User
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Storage Inspector -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-h6">Storage Inspector</v-card-title>
            <v-card-text>
              <v-btn
                color="primary"
                small
                class="mr-2 mb-2"
                @click="inspectStorage"
              >
                Inspect Storage
              </v-btn>
              <v-btn
                color="secondary"
                small
                class="mr-2 mb-2"
                @click="clearAllStorage"
              >
                Clear All Storage
              </v-btn>
              <div v-if="storageData" class="mt-2">
                <h4>Session Storage:</h4>
                <pre class="storage-display">{{ JSON.stringify(storageData.session, null, 2) }}</pre>
                <h4>Local Storage:</h4>
                <pre class="storage-display">{{ JSON.stringify(storageData.local, null, 2) }}</pre>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Cross-Tab Debug -->
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-h6">Cross-Tab Debug</v-card-title>
            <v-card-text>
              <v-btn
                color="info"
                small
                class="mr-2 mb-2"
                @click="broadcastAuthTest"
              >
                Broadcast Auth Test
              </v-btn>
              <v-btn
                color="warning"
                small
                class="mr-2 mb-2"
                @click="requestEmailTest"
              >
                Request Email Test
              </v-btn>
              <div class="mt-2">
                <h4>Tab ID: {{ currentTabId }}</h4>
                <h4>Message Count: {{ crossTabMessages.length }}</h4>
                <div v-if="crossTabMessages.length > 0" class="mt-2">
                  <v-alert
                    v-for="(msg, idx) in crossTabMessages.slice(0, 5)"
                    :key="idx"
                    type="info"
                    dense
                    class="mb-1"
                    style="font-size: 12px;"
                  >
                    <strong>{{ msg.type }}:</strong> {{ JSON.stringify(msg.data).substring(0, 100) }}...
                  </v-alert>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Test Log -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="text-h6">Test Log</v-card-title>
            <v-card-text>
              <v-btn
                color="error"
                small
                class="mb-2 mr-2"
                @click="testLog = []"
              >
                Clear Log
              </v-btn>
              <v-btn
                color="info"
                small
                class="mb-2"
                @click="logToConsole = !logToConsole"
              >
                Console Log: {{ logToConsole ? 'ON' : 'OFF' }}
              </v-btn>
              <div class="test-log">
                <div
                  v-for="(log, idx) in testLog"
                  :key="idx"
                  class="log-entry"
                  :class="`log-${log.type}`"
                >
                  <span class="log-timestamp">{{ log.timestamp }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuth, useEmailManagement } from '@/composables/useAuth';
import authService from '@/services/authService';
import tabCommunicationService from '@/services/tabCommunicationService';
import navigationService from '@/services/navigationService';

// Composable test
const {
  currentUser,
  isAuthenticated,
  isAnonymous,
  isLoading,
  isSigningIn,
  error,
  signInAnonymously,
  signOut,
  clearError,
  refreshUser,
} = useAuth();

const { storeEmailForSignIn, getStoredEmail, clearStoredEmail } = useEmailManagement();

// Test state
const authLoading = ref(false);
const authResult = ref(null);
const navResult = ref(null);
const testMessage = ref('Hello from tab!');
const tabMessages = ref([]);
const testLog = ref([]);

// Debug state
const storageData = ref(null);
const crossTabMessages = ref([]);
const currentTabId = ref('');
const logToConsole = ref(true);

// Tab communication listener
let tabListener = null;

const log = (type, message) => {
  const timestamp = new Date().toLocaleTimeString();
  testLog.value.unshift({ type, message, timestamp });
  if (logToConsole.value) {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

// Auth Service Tests
const testAnonymousSignIn = async () => {
  try {
    authLoading.value = true;
    authResult.value = null;
    log('info', 'Testing anonymous sign in...');

    const result = await authService.signInAnonymously();

    authResult.value = {
      type: 'success',
      message: `Anonymous sign in successful! UID: ${result.user.uid.substring(0, 8)}...`,
    };

    log('success', `Anonymous sign in successful: ${result.user.uid}`);
  } catch (error) {
    authResult.value = {
      type: 'error',
      message: `Error: ${error.message}`,
    };
    log('error', `Anonymous sign in failed: ${error.message}`);
  } finally {
    authLoading.value = false;
  }
};

const testSignOut = async () => {
  try {
    authLoading.value = true;
    authResult.value = null;
    log('info', 'Testing sign out...');

    await authService.signOut();

    authResult.value = {
      type: 'success',
      message: 'Sign out successful!',
    };

    log('success', 'Sign out successful');
  } catch (error) {
    authResult.value = {
      type: 'error',
      message: `Error: ${error.message}`,
    };
    log('error', `Sign out failed: ${error.message}`);
  } finally {
    authLoading.value = false;
  }
};

const testCurrentUser = () => {
  const user = authService.getCurrentUser();

  if (user) {
    authResult.value = {
      type: 'info',
      message: `Current user: ${user.uid} (Anonymous: ${user.isAnonymous})`,
    };
    log('info', `Current user: ${user.uid}, anonymous: ${user.isAnonymous}`);
  } else {
    authResult.value = {
      type: 'warning',
      message: 'No current user',
    };
    log('warning', 'No current user found');
  }
};

// Tab Communication Tests
const sendTestMessage = () => {
  log('info', `Sending test message: ${testMessage.value}`);

  tabCommunicationService.sendMessage('test-channel', {
    type: 'TEST_MESSAGE',
    message: testMessage.value,
    timestamp: Date.now(),
  });

  testMessage.value = '';
};

const testEmailStorage = () => {
  const testEmail = 'test@example.com';
  log('info', `Testing email storage: ${testEmail}`);

  // Store email
  storeEmailForSignIn(testEmail);

  // Retrieve email
  const retrievedEmail = getStoredEmail();

  if (retrievedEmail === testEmail) {
    tabMessages.value.unshift('✅ Email storage test passed');
    log('success', 'Email storage test passed');
  } else {
    tabMessages.value.unshift('❌ Email storage test failed');
    log('error', 'Email storage test failed');
  }
};

const clearTabData = () => {
  log('info', 'Clearing all tab data');
  clearStoredEmail();
  tabCommunicationService.cleanExpiredTabData();
  tabMessages.value = [];
};

// Navigation Service Tests
const storeCurrentContext = () => {
  log('info', 'Storing current context');
  const context = navigationService.storeCurrentContext({ test: 'data' });

  navResult.value = {
    type: 'success',
    message: `Context stored with tab ID: ${context.tabId}`,
  };

  log('success', `Context stored: ${JSON.stringify(context)}`);
};

const getStoredContext = () => {
  log('info', 'Getting stored context');
  const context = navigationService.getOriginalContext();

  if (context) {
    navResult.value = {
      type: 'info',
      message: `Found context from: ${new Date(context.timestamp).toLocaleTimeString()}`,
    };
    log('success', `Context retrieved: ${JSON.stringify(context)}`);
  } else {
    navResult.value = {
      type: 'warning',
      message: 'No stored context found',
    };
    log('warning', 'No stored context found');
  }
};

const testTabInfo = () => {
  log('info', 'Getting current tab info');
  const tabInfo = navigationService.getCurrentTabInfo();

  navResult.value = {
    type: 'info',
    message: `Tab ID: ${tabInfo.id}, Visible: ${tabInfo.isVisible}`,
  };

  log('info', `Tab info: ${JSON.stringify(tabInfo)}`);
};

const clearStoredContext = () => {
  log('info', 'Clearing stored context');
  navigationService.clearOriginalContext();

  navResult.value = {
    type: 'success',
    message: 'Context cleared',
  };

  log('success', 'Context cleared');
};

// Composable Tests
const composableAnonymousSignIn = async () => {
  try {
    log('info', 'Testing useAuth composable - anonymous sign in');
    const result = await signInAnonymously();
    log('success', `Composable anonymous sign in successful: ${result.user.uid}`);
  } catch (err) {
    log('error', `Composable anonymous sign in failed: ${err.message}`);
  }
};

const composableSignOut = async () => {
  try {
    log('info', 'Testing useAuth composable - sign out');
    await signOut();
    log('success', 'Composable sign out successful');
  } catch (err) {
    log('error', `Composable sign out failed: ${err.message}`);
  }
};

// Debug methods
const inspectStorage = () => {
  log('info', 'Inspecting storage');

  const sessionData = {};
  const localData = {};

  // Session storage
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    try {
      const value = sessionStorage.getItem(key);
      sessionData[key] = JSON.parse(value);
    } catch {
      sessionData[key] = sessionStorage.getItem(key);
    }
  }

  // Local storage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    try {
      const value = localStorage.getItem(key);
      localData[key] = JSON.parse(value);
    } catch {
      localData[key] = localStorage.getItem(key);
    }
  }

  storageData.value = {
    session: sessionData,
    local: localData,
  };

  log('success', `Storage inspected: ${Object.keys(sessionData).length} session, ${Object.keys(localData).length} local`);
};

const clearAllStorage = () => {
  log('info', 'Clearing all storage');
  sessionStorage.clear();
  localStorage.clear();
  storageData.value = null;
  tabMessages.value = [];
  crossTabMessages.value = [];
  log('success', 'All storage cleared');
};

const broadcastAuthTest = () => {
  log('info', 'Broadcasting auth test message');

  tabCommunicationService.broadcastAuthSuccess({
    userId: 'test-user-123',
    isUpgrade: false,
    originalTabContext: navigationService.getOriginalContext(),
  });

  log('success', 'Auth test broadcast sent');
};

const requestEmailTest = () => {
  log('info', 'Testing email request mechanism');

  const testTabId = tabCommunicationService.getTabId();

  // First store an email
  storeEmailForSignIn('test-cross-tab@example.com');

  // Then request it (simulating cross-tab request)
  tabCommunicationService.broadcastEmailStoreRequest('', testTabId);

  log('success', `Email request test sent from tab: ${testTabId}`);
};

// Setup and cleanup
onMounted(() => {
  log('info', 'Services test page mounted');

  // Set current tab ID
  currentTabId.value = tabCommunicationService.getTabId();

  // Listen for tab communication messages
  tabListener = tabCommunicationService.addListener('test-channel', (message) => {
    tabMessages.value.unshift(`📨 ${message.type}: ${message.message}`);
    crossTabMessages.value.unshift({ type: 'TEST_CHANNEL', data: message });
    log('info', `Received test message: ${JSON.stringify(message)}`);
  });

  // Listen for auth messages (with detailed logging)
  tabCommunicationService.addAuthListener((message) => {
    tabMessages.value.unshift(`🔐 Auth: ${message.type}`);
    crossTabMessages.value.unshift({ type: 'AUTH_MESSAGE', data: message });
    log('info', `Received auth message: ${message.type} - ${JSON.stringify(message)}`);

    // Handle different auth message types for debugging
    switch (message.type) {
      case 'AUTH_SUCCESS':
        log('success', `Auth success received - User: ${message.userId}, Upgrade: ${message.isUpgrade}`);
        break;
      case 'AUTH_FAILURE':
        log('error', `Auth failure received - Error: ${message.error}`);
        break;
      case 'EMAIL_STORE_REQUEST':
        log('info', `Email store request from tab: ${message.requestingTabId}`);
        break;
      case 'EMAIL_STORE_RESPONSE':
        log('success', `Email store response: ${message.email} from tab: ${message.respondingTabId}`);
        break;
      default:
        log('warning', `Unknown auth message type: ${message.type}`);
    }
  });
});

onUnmounted(() => {
  log('info', 'Services test page unmounted');

  if (tabListener) {
    tabCommunicationService.removeListener('test-channel', tabListener);
  }
});
</script>

<style scoped>
.services-test-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px 0;
}

.test-log {
  max-height: 300px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 12px;
  background-color: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.log-entry {
  display: flex;
  margin-bottom: 4px;
  padding: 2px 0;
}

.log-timestamp {
  color: #666;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-success .log-message {
  color: #4caf50;
}

.log-error .log-message {
  color: #f44336;
}

.log-warning .log-message {
  color: #ff9800;
}

.log-info .log-message {
  color: #2196f3;
}

pre {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 200px;
}

.v-card {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.storage-display {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 11px;
  border: 1px solid #ddd;
}
</style>
