import { createRouter, createWebHistory } from 'vue-router';
import LoadingPage from '@/views/LoadingPage';
import Login from '@/views/Login';
import Rooms from '@/views/Rooms';
import Room from '@/views/Room';
import Profile from '@/views/Profile';
import RoomForm from '@/components/RoomForm';
import AuthAction from '@/views/AuthAction';

const routes = [
  {
    path: '/',
    name: 'loading',
    component: LoadingPage,
  },
  {
    path: '/rooms',
    name: 'rooms',
    component: Rooms,
  },
  {
    path: '/acctmgmt/__/auth/action',
    name: 'auth-action',
    component: AuthAction,
  },
  {
    path: '/rooms/:roomId',
    name: 'room',
    component: Room,
    props: true,
  },
  {
    path: '/profile',
    name: 'profile',
    component: Profile,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile/room/create',
    name: 'room-create',
    component: RoomForm,
    props: { isEdit: false },
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/profile/room/:roomId/edit',
    name: 'room-edit',
    component: RoomForm,
    props: (route) => ({ roomId: route.params.roomId, isEdit: true }),
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: '/signup',
    name: 'Signup',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import('@/components/SignupForm'),
  },
  {
    path: '/user',
    component: Login,
    title: 'Users',
    meta: {
      auth: ['ALL'],
    },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/components/LoginForm'),
      },
      {
        path: 'signup',
        name: 'signup',
        meta: {
          auth: ['ALL'],
        },
        component: () => import('@/components/SignupForm'),
      },
      // {
      //   path: 'profile', name: 'profile', component: Profile, meta: { auth: ['USER'] },
      // },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guards
router.beforeEach((to, from, next) => {
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // In a real app, you'd check the user's authentication status here
    // For now, we'll allow access and handle it in the component
    console.log('Accessing protected route:', to.name);
  }
  next();
});

export default router;
