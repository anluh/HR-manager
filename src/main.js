import Vue from 'vue'
import App from './App.vue'
import router from './router'
import moment from 'moment';
import Vuelidate from 'vuelidate'
import Print from 'vue-print-nb'
import multiselect from 'vue-multiselect'
import DatePicker from 'vue2-datepicker';
import BackButton from './components/BackButton.vue';
import VueI18n from 'vue-i18n';
import { ENGLISH_TRANSLATIONS } from './translations/en';
import { CZECH_TRANSLATIONS } from './translations/cz';
import { EN_DATEPICKER } from './translations/datepicker-en';
import { CZ_DATEPICKER } from './translations/datepicker-cz';
import './js/jquery.min'
import './js/materialize.js'

Vue.use(Print);
Vue.use(Vuelidate)
Vue.use(VueI18n);
window.moment = moment;


// Change default max events listeners
require('events').EventEmitter.defaultMaxListeners = 100;

Vue.config.productionTip = false

// Translations
const TRANSLATIONS = {
  en: ENGLISH_TRANSLATIONS,
  cz: CZECH_TRANSLATIONS
}
const i18n = new VueI18n({
  locale: 'cz',
  messages: TRANSLATIONS,
})

Vue.filter('reverse', function(value) {
  return value.slice().reverse();
});
Vue.mixin({
  methods: {
    WithComaToFloat(value) {
      return value ? parseFloat(value.toString().replace(',','.')) : 0
    }
  },
  computed: {
    datepickerLang() {
      return this.$root.$i18n.locale === 'en' ? EN_DATEPICKER : CZ_DATEPICKER
    }
  },
  filters: {
    numberFormatter(value) {
      return value ? parseFloat(value).toLocaleString().replace(",", " ") : 0;
    }
  }
})

Vue.component('multiselect', multiselect)
Vue.component('DatePicker', DatePicker)
Vue.component('BackButton', BackButton)

new Vue({
  i18n,
  router,
  render: h => h(App)
}).$mount('#app')
