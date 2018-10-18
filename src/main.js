import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)

import './js/jquery.min'
import './js/materialize.js'


Vue.config.productionTip = false

Vue.filter('reverse', function(value) {
  return value.slice().reverse();
});



new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
