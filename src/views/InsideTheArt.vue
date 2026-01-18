<template>
    <div class="inside-the-art">
        <!-- Navigation (Transparent to start) -->
        <v-app-bar flat color="transparent" absolute dark height="80">
            <v-toolbar-title>
                <router-link to="/rooms" style="text-decoration: none;">
                    <v-img src="/logo-206-70.png" contain width="120" height="40" alt="toonstalk logo" />
                </router-link>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn color="primary" rounded="xl" text to="/rooms" class="mr-2 primary">Explore Rooms</v-btn>
            <v-btn color="primary" rounded="xl" @click="handleCreateRoom">Create Room</v-btn>
        </v-app-bar>

        <!-- Hero Section -->
        <section class="hero-section" :style="{ backgroundPositionY: `${scrollY * 0.2}px` }">
            <div class="hero-overlay"></div>
            <v-container class="fill-height">
                <v-row align="center" justify="center" class="text-center">
                    <v-col cols="12" md="10">
                        <p class="hero-intro mb-8 text-white">Inside the Art<br /></p>
                        <h1 class="display-1 main-title mb-6">
                            <span class="gradient-text">We get people talking <i>about</i> your art, <i>with</i> your
                                art, <strong>inside</strong> your art.</span>
                        </h1>
                        <p class="hero-intro mb-10 text-white">
                            Most platforms help you share your work.<br />
                            <strong>We help you build a world for it.</strong>
                        </p>
                        <div class="hero-messaging mb-12">
                            <div class="highlight-box">
                                <strong>Your art deserves a place people can return to</strong>
                            </div>
                        </div>
                        <div class="cta-group">
                            <v-btn color="primary" size="x-large" rounded="xl" class="mx-2 mb-4 px-8"
                                @click="handleCreateRoom" elevation="8">
                                Create your room
                            </v-btn>
                            <v-btn variant="outlined" color="white" size="x-large" rounded="xl" class="mx-2 mb-4 px-8"
                                to="/rooms">
                                See rooms made by creators
                            </v-btn>
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </section>

        <!-- What Happens Section -->
        <section class="section simple-section reveal">
            <v-container>
                <h2 class="section-h2 text-center mb-12">
                    Turn Your Art Into your Place
                </h2>

                <v-row>
                    <!-- Step 1 -->
                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100 step-card">
                            <div class="step-visual" :style="{ padding: '0 50px' }">
                                <v-img src="public/room_example.png" cover class="image" />
                            </div>
                            <h3>Create a room</h3>
                            <p>
                                Turn your art into a permanent space. A room people can enter, not just scroll past.
                            </p>
                        </v-card>
                    </v-col>

                    <!-- Step 2 -->
                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100 step-card">
                            <div class="step-visual" :style="{ padding: '0 50px' }">
                                <v-img src="public/join_example.png" cover class="image" />
                            </div>
                            <h3>Invite people in</h3>
                            <p>
                                Share a link. Fans join as avatars and meet inside the world you created.
                            </p>
                        </v-card>
                    </v-col>

                    <!-- Step 3 -->
                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100 step-card">
                            <div class="step-visual" :style="{ padding: '0 50px' }">
                                <v-img src="public/grow_example.png" cover class="image" />
                            </div>
                            <h3>See it grow</h3>
                            <p>
                                Conversations leave traces. People return. A community starts to feel like home.
                            </p>
                        </v-card>
                    </v-col>
                </v-row>
            </v-container>
        </section>

        <!-- The Problem Section -->
        <section class="section problem-section reveal">
            <v-container>
                <v-row align="center">
                    <v-col cols="12" md="6">
                        <h2 class="section-h2 mb-6">
                            On most art platforms, people see your work — but never connect with it.
                        </h2>

                        <div class="bullets mb-8">
                            <div class="bullet-item">
                                <v-icon color="error" class="mr-3">mdi-close-circle-outline</v-icon>
                                <span>Conversation is limited to short comments</span>
                            </div>
                            <div class="bullet-item">
                                <v-icon color="error" class="mr-3">mdi-close-circle-outline</v-icon>
                                <span>Fans experience the work alone</span>
                            </div>
                            <div class="bullet-item">
                                <v-icon color="error" class="mr-3">mdi-close-circle-outline</v-icon>
                                <span>Any emotional bond fades quickly</span>
                            </div>
                        </div>

                        <p class="text-body-1 mb-6">
                            Traditional platforms are built for browsing and exposure,
                            not for shared presence or lasting connection.
                        </p>

                        <div class="insight-pill">
                            Art creates emotion. <strong>Most platforms stop there.</strong>
                        </div>
                    </v-col>

                    <v-col cols="12" md="6" class="text-center">
                        <div class="problem-visual" :style="{ padding: '0 60px' }">
                            <v-img src="public/problem.png" cover class="image" />
                        </div>
                    </v-col>
                </v-row>
            </v-container>
        </section>
        <!-- Build a World Section -->
        <section class="section color-section reveal">
            <v-container>

                <!-- Header -->
                <v-row justify="center" class="text-center">
                    <v-col cols="12" md="9">
                        <h2 class="section-h2 mb-6">Build a World People Want to Stay In</h2>
                        <p class="text-body-1 mb-14">
                            Toonstalk isn’t about distribution or algorithms.
                            It’s about creating a place where art, people, and conversation live together.
                        </p>
                    </v-col>
                </v-row>

                <!-- Core Capabilities -->
                <v-row class="mb-14">
                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100">
                            <v-icon size="48" color="primary" class="mb-4">mdi-palette-swatch</v-icon>
                            <h3>Design the Space</h3>
                            <p>
                                Turn your art into walls, backgrounds, and environments.
                                People don’t scroll past your work — they step inside it.
                            </p>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100">
                            <v-icon size="48" color="secondary" class="mb-4">mdi-account-group</v-icon>
                            <h3>Design the People</h3>
                            <p>
                                Custom avatars let fans express themselves through your style
                                and feel like part of the same world.
                            </p>
                        </v-card>
                    </v-col>

                    <v-col cols="12" md="4">
                        <v-card class="feature-card h-100">
                            <v-icon size="48" color="accent" class="mb-4">mdi-link-variant</v-icon>
                            <h3>Connection Without Friction</h3>
                            <p>
                                No feeds to chase. No algorithms to please.
                                Just direct, lasting connection between people and art.
                            </p>
                        </v-card>
                    </v-col>
                </v-row>

                <!-- Growth (absorbed, not separated) -->
                <v-row justify="center" class="text-center">
                    <v-col cols="12" md="8">
                        <div class="hero-messaging mb-12">
                            <div class="highlight-box text-">
                                They arrive, they stay, they invite
                            </div>
                        </div>
                    </v-col>
                </v-row>

                <!-- Closing -->
                <div class="footer-msg mt-14 text-center">
                    <p>Some rooms are calm. Some are chaotic.</p>
                    <p class="final-word"><strong>Every room is a home.</strong></p>
                </div>

            </v-container>
        </section>



        <!-- Final CTA Section -->
        <section class="final-cta-section reveal">
            <v-container class="text-center">
                <h2 class="display-2 mb-6">Stop Posting. Start Building.</h2>
                <p class="cta-subtext mb-10">
                    Your art is ready to be inhabited.
                </p>
                <div class="cta-buttons">
                    <v-btn color="primary" size="x-large" rounded="xl" class="mx-2 mb-4 px-10" @click="handleCreateRoom"
                        elevation="12">
                        Create your room
                    </v-btn>
                    <v-btn variant="outlined" color="white" size="x-large" rounded="xl" class="mx-2 mb-4 px-10"
                        to="/rooms">
                        Explore creator rooms
                    </v-btn>
                </div>
            </v-container>
        </section>

        <!-- Footer -->
        <footer class="ita-footer py-10">
            <v-container class="text-center">
                <v-img src="/logo-206-70.png" contain width="120" class="mx-auto mb-4" />
                <p class="text-grey-darken-1">&copy; {{ new Date().getFullYear() }} Toonstalk. All rights reserved.</p>
                <div class="footer-links-row">
                    <router-link to="/rooms">Rooms</router-link>
                    <router-link to="/about-us">About Us</router-link>
                    <router-link to="/pricing">Pricing</router-link>
                </div>
            </v-container>
        </footer>

        <!-- Auth Dialog for Login/Signup -->
        <v-dialog v-model="showAuthDialog" max-width="400">
            <v-card class="auth-dialog">
                <v-card-title class="text-h6 text-center">
                    Welcome to ToonsTalk
                </v-card-title>
                <v-card-text class="text-center">
                    <p class="mb-4">
                        Join our community to create your own rooms and start building your art-first space!
                    </p>
                    <div id="firebaseui-auth-container"></div>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="showAuthDialog = false"> Cancel </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup>
import {
    onMounted, onUnmounted, ref, computed, watch, nextTick
} from 'vue';
import { useRouter } from 'vue-router';
import { getAuth } from 'firebase/auth';
import useUserStore from '@/stores/user';
import { useSeo } from '@/composables/useSeo';

const router = useRouter();
const userStore = useUserStore();
const scrollY = ref(0);
const showAuthDialog = ref(false);
const pendingCreateRoom = ref(false);

const isUserAuthenticated = computed(() => {
    const hasUserId = !!userStore.currentUser?.userId;
    const isNotAnonymousInStore = !userStore.currentUser?.isAnonymous;
    const auth = getAuth();
    const authUser = auth.currentUser;
    const isAuthenticatedInAuth = authUser && !authUser.isAnonymous;
    return hasUserId && isNotAnonymousInStore && isAuthenticatedInAuth;
});

const handleScroll = () => {
    scrollY.value = window.scrollY;
};

const handleCreateRoom = () => {
    if (isUserAuthenticated.value) {
        router.push('/profile/room/create');
    } else {
        pendingCreateRoom.value = true;
        showAuthDialog.value = true;
    }
};

onMounted(() => {
    useSeo({
        title: 'Inside the Art - Where Communities Live | Toonstalk',
        description: 'We get people talking about your art, with your art, inside your art. Design the walls, the people, and the community.',
        url: 'https://toonstalk.com/inside-the-art',
        keywords: ['art community', 'creator economy', 'room ownership', 'immersive art', 'fan engagement'],
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Reveal-on-scroll
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                }
            });
        },
        { threshold: 0.15 }
    );

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
});

watch(showAuthDialog, (newVal) => {
    if (newVal) {
        nextTick(() => {
            userStore.setFirebaseUiInstance('inside-the-art');
        });
    }
});

watch(isUserAuthenticated, (newVal) => {
    if (newVal && pendingCreateRoom.value) {
        pendingCreateRoom.value = false;
        showAuthDialog.value = false;
        router.push('/profile/room/create');
    }
});

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
.inside-the-art {
    background-color: #0c0c0e;
    color: white;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow-x: hidden;
}

/* Sections */
.section {
    padding: 100px 0;
}

/* Hero Section */
.hero-section {
    height: 100vh;
    min-height: 700px;
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    overflow: hidden;
}

.hero-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
    z-index: 1;
}

.hero-section .v-container {
    position: relative;
    z-index: 2;
}

.main-title {
    font-size: 4.5rem !important;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em !important;
}

@media (max-width: 600px) {
    .main-title {
        font-size: 2.5rem !important;
    }
}

.gradient-text {
    background: white;
    /* background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); */
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0px 1px 1px rgb(250, 250, 250));
}

.hero-intro {
    font-size: 1.5rem;
    color: #a0a0aa;
    line-height: 1.6;
}

.hero-messaging {
    font-size: 1.25rem;
    color: #d4d4d8;
}

.highlight-box {
    background: rgba(255, 255, 255, 0.05);
    padding: 24px;
    border-radius: 16px;
    display: inline-block;
    margin-top: 24px;
    border-left: 4px solid var(--v-primary-base);
}

/* Typography */
.section-h2 {
    font-size: 2.75rem;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: -0.01em;
}

@media (max-width: 600px) {
    .section-h2 {
        font-size: 2rem;
    }
}

/* Problem Section */
.problem-section {
    background-color: #0c0c0e;
}

.bullet-item {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    margin-bottom: 12px;
    color: #d4d4d8;
}

.insight-pill {
    background: white;
    color: black;
    padding: 16px 32px;
    border-radius: 50px;
    display: inline-block;
    font-size: 1.1rem;
}

/* Dark Section */
.dark-section {
    background-color: #050505;
}

.comparison-list {
    list-style: none;
    padding: 0;
}

.comparison-list li {
    margin-bottom: 12px;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
}

.comparison-list li::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 16px;
    flex-shrink: 0;
}

.comparison-list.legacy li::before {
    background-color: #ef4444;
}

.comparison-list.toonstalk li::before {
    background-color: #22c55e;
}

.ownership-quote {
    font-size: 1.4rem;
    border-top: 1px solid #27272a;
    padding-top: 24px;
    color: #d4d4d8;
}

.icon-circle {
    width: 240px;
    height: 240px;
    background: #18181b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
}

.shadow-purple {
    box-shadow: 0 0 60px rgba(168, 85, 247, 0.2);
}

/* Comparison Cards */
.comparison-card {
    background: #18181b !important;
    color: white !important;
    border-radius: 24px !important;
    padding: 32px !important;
    text-align: left;
    transition: transform 0.3s ease;
}

.comparison-card.active {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
    border: 2px solid #4338ca !important;
}

.comparison-card .v-card-title {
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    margin-bottom: 16px !important;
    padding: 0 !important;
}

.comparison-card .point {
    margin-bottom: 8px;
    opacity: 0.8;
}

.conclusion-text {
    font-size: 1.5rem;
    color: #a0a0aa;
}

/* Model Section */
.model-steps {
    display: flex;
    flex-direction: column;
    gap: 24px;
}

.step {
    display: flex;
    align-items: center;
    gap: 20px;
}

.step-num {
    width: 40px;
    height: 40px;
    background: var(--v-primary-base);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
}

.step-text {
    font-size: 1.4rem;
    font-weight: 700;
}

.extra-bold {
    font-size: 1.25rem;
    border-left: 4px solid var(--v-secondary-base);
    padding-left: 20px;
}

/* Feature Cards */
.feature-card {
    background: #18181b !important;
    color: white !important;
    padding: 40px !important;
    border-radius: 24px !important;
    border: 1px solid #27272a !important;
    transition: all 0.3s ease !important;
}

.feature-card:hover {
    border-color: #52525b !important;
    transform: translateY(-8px);
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 16px;
    font-weight: 700;
}

.feature-card p {
    color: #a0a0aa;
    line-height: 1.6;
}

.final-word {
    font-size: 2rem;
    color: var(--v-primary-base);
}

/* Distribution */
.growth-box {
    background: #111111;
    border-radius: 32px;
    border: 1px dashed #333;
}

.growth-step {
    font-size: 1.75rem;
    font-weight: 800;
    padding: 20px;
    color: white;
}

/* Final CTA */
.final-cta-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 120px 0;
}

.cta-subtext {
    font-size: 1.75rem;
    opacity: 0.95;
    line-height: 1.4;
}

/* Footer */
.ita-footer {
    background: #000;
}

.footer-links-row {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 24px;
}

.footer-links-row a {
    color: #a0a0aa;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.2s;
}

.footer-links-row a:hover {
    color: white;
}

/* =========================
   Reveal animations
   ========================= */
.reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.reveal.in-view {
    opacity: 1;
    transform: translateY(0);
}

/* Slight stagger for children */
.reveal.in-view>* {
    animation: fadeUp 0.8s ease both;
}

@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* =========================
   Ambient floating elements
   ========================= */

.float-slow {
    animation: floatSlow 8s ease-in-out infinite;
}

@keyframes floatSlow {
    0% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-12px);
    }

    100% {
        transform: translateY(0px);
    }
}

/* =========================
   Glass subtle parallax feel
   ========================= */

.glass-section {
    position: relative;
    overflow: hidden;
}

.glass-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 30% 20%,
            rgba(99, 102, 241, 0.08),
            transparent 60%);
    pointer-events: none;
}

/* =========================
   Section gradient placeholders
   (temporary, future images)
   ========================= */

.problem-section {
    background: linear-gradient(180deg, #0c0c0e 0%, #0f0f14 100%);
}

.dark-section {
    background: linear-gradient(180deg, #050505 0%, #09090b 100%);
}

.color-section {
    background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.12),
            rgba(168, 85, 247, 0.12));
}

.distribution-section {
    background: radial-gradient(circle at top center,
            rgba(34, 197, 94, 0.08),
            transparent 70%);
}

/* Step cards */
.step-card {
    position: relative;
    padding-top: 0 !important;
    overflow: hidden;
}

/* Visual placeholder */
.step-visual {
    margin: -40px -40px 32px -40px;
    height: 250px;
    object-fit: contain !important;
    margin-top: -20px;
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;

    .image {
        width: 70%;

    }
}

.visual-box {
    width: 100%;
    height: 100%;
    border-radius: 24px;
    opacity: 0.9;
}

/* Temporary gradients (replace later with screenshots) */
.gradient-room {
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.gradient-invite {
    background: linear-gradient(135deg, #22c55e, #16a34a);
}

.gradient-grow {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
}

/* Step number badge */
.step-number {
    width: 40px;
    height: 40px;
    background: var(--v-primary-base);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    margin-bottom: 16px;
}

/* Headings */
.step-card h3 {
    font-size: 1.4rem;
    font-weight: 700;
    margin-bottom: 12px;
}

.step-card p {
    color: #a0a0aa;
    line-height: 1.6;
}

/* =========================
   Auth Dialog Styling
   ========================= */
.auth-dialog {
    border-radius: 24px !important;
    background: #18181b !important;
    color: white !important;
    border: 1px solid #27272a !important;
}

.auth-dialog .v-card-title {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 700;
    padding-top: 32px !important;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.auth-dialog .v-card-text {
    padding-bottom: 24px !important;
}

.auth-dialog .v-card-text p {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #a0a0aa;
    line-height: 1.6;
}
</style>
