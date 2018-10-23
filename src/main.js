import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import moment from 'moment';
import Vuelidate from 'vuelidate'
Vue.use(Vuelidate)
window.moment = moment;

import './js/jquery.min'
import './js/materialize.js'

// Change default max events listeners
require('events').EventEmitter.defaultMaxListeners = 100;

Vue.config.productionTip = false

Vue.filter('reverse', function(value) {
  return value.slice().reverse();
});



new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
