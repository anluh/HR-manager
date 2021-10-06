import Vue from 'vue'
import Router from 'vue-router'
import Workers from './views/Workers.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '*',
      name: 'default',
      component: () => import('./views/Default.vue')
    },
    {
      path: '/workers',
      name: 'workers',
      component: Workers
    },
    {
      path: '/firms',
      name: 'firms',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Firms.vue')
    },
    {
      path: '/add/worker',
      name: 'addworker',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/AddWorker.vue')
    },
    {
      path: '/worker/edit/:id',
      name: 'editworker',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/AddWorker.vue')
    },
    {
      path: '/add/firm',
      name: 'addfirm',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/AddFirm.vue')
    },
    {
      path: '/firm/edit/:id',
      name: 'editfirm',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/AddFirm.vue')
    },
    {
      path: '/worker/info/:id',
      name: 'workerinfo',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/WorkerInfo.vue')
    },
    {
      path: '/hours',
      name: 'hours',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Hours.vue')
    },
    {
      path: '/history/edit/:id',
      name: 'edithours',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/EditHours.vue')
    },
    {
      path: '/deposit',
      name: 'deposit',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Deposit.vue')
    },
    {
      path: '/deposit/edit/:id',
      name: 'editdeposit',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/EditDeposit.vue')
    },
    {
      path: '/report',
      name: 'report',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Report.vue')
    },
  ]
})
