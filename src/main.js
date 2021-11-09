import Vue from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment';
import Vuelidate from 'vuelidate'
import Print from 'vue-print-nb'
import multiselect from 'vue-multiselect'
import DatePicker from 'vue2-datepicker';
import BackButton from './components/BackButton.vue';

Vue.use(Print);
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
Vue.mixin({
  methods: {
    WithComaToFloat(value) {
      return value ? parseFloat(value.toString().replace(',','.')) : 0
    }
  }
})

Vue.component('multiselect', multiselect)
Vue.component('DatePicker', DatePicker)
Vue.component('BackButton', BackButton)

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
