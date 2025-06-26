import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login';
import Rooms from '@/views/Rooms';
import Room from '@/views/Room';
import LoadingPage from '@/views/LoadingPage';

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
    path: '/rooms/:roomId',
    name: 'room',
    component: Room,
    props: true,
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
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// router.beforeEach((to, from, next) => {
//   console.log({ to, from, next });
//   next();
// });

export default router;
