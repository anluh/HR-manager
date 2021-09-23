<template>
  <div class="salary">
    <div class="page-title">
      <h3>Hours</h3>
    </div>

    <div class="page-wrapper">
      <transition name="slide-fade">
        <div v-if="hoursErr" class="toast toast--error">Hours on this month are already added.</div>
      </transition>

      <div class="input-field add-salary__month">
        <input id="add-salary__month"
               v-model.lazy="month"
               :class="{ invalid: !$v.month.isDate && $v.month.required, valid: $v.month.isDate && $v.month.required }"
               type="text">
        <label for="add-salary__month">Month</label>
        <span class="danger" v-show="!$v.month.isDate && $v.month.required">Enter valid month MM.YYYY</span>
      </div>
      <form class="add-salary"
            @submit.prevent="$v.$touch(); if(!$v.newSalary.$invalid){saveSalary(); $v.newSalary.$reset()}">
        <div class="add-salary__data" :class="{ disabled: !$v.month.isDate || !$v.month.required }">
          <div class="input-field col s12 m6">
            <select v-model="newSalary.Firm">
              <option :value="firmNone.Name" disabled>None</option>
              <option :value="firm.Name" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">
                {{ firm.Name }}
              </option>
            </select>
            <label>Firm</label>
            <span class="error danger"
                  v-show="$v.newSalary.$dirty && !$v.newSalary.Firm.notNone">This field is required</span>
          </div>
          <div class="input-field">
            <autocomplete :options="workers" ref="workerField" v-model="newSalary.Worker"></autocomplete>
            <span class="error danger" v-show="$v.newSalary.$dirty && !$v.newSalary.Worker.Name.required">This field is required</span>
          </div>
          <div class="input-field">
            <input type="text" id="add-salary__hours" v-model="newSalary.Hours">
            <label for="add-salary__hours">Hours</label>
            <span class="error danger" v-show="$v.newSalary.$dirty && !$v.newSalary.Hours.required">This field is required</span>
            <span class="error danger"
                  v-show="$v.newSalary.$dirty && $v.newSalary.Hours.required && !$v.newSalary.Hours.isNumber">Enter valid hours</span>
          </div>
          <button :disabled="!$v.month.isDate" class="waves-effect waves-light btn">Save</button>
        </div>
      </form>

      <div class="hide-history">
        <a @click.prevent="hideHistory = !hideHistory" href="#">
          <span v-if="!hideHistory"><i class="fas fa-eye-slash"></i>Hide history</span>
          <span v-if="hideHistory"><i class="fas fa-eye"></i>Show history</span>
        </a>
      </div>

      <div :class="{hidden: hideHistory}" class="history-wrapper">
        <table class="striped table-list" cellspacing="0" cellpadding="0">
          <thead>
          <tr>
            <th>Name</th>
            <th>Month</th>
            <th>Hours</th>
            <th>Firm</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(history, index) in historys" :key="index">
            <td>{{ history.Worker_name }}</td>
            <td>{{ history.Month | dateFormatter }}</td>
            <td>{{ history.Hours }}</td>
            <td>{{ history.Firm }}</td>
            <td>
              <div v-show="hoursCheckSalary(history)">
                <router-link @click.stop
                             :to="{ name: 'edithours', params: { id: history.Id, history: history, back: '/salary' } }"
                             class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                <modal @submit="deleteHistory(history)" submit-btn="Delete">
                  <i v-if="!history.Report_id" class="danger far fa-trash-alt"></i>
                  <div slot="popup-text">Do you want to delete this worker hours?</div>
                </modal>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>

  </div>
</template>

<script>
import autocomplete from "../components/autocomplete"
import moment from 'moment';

const {ipcRenderer} = require('electron');
import {required} from 'vuelidate/lib/validators'
import modal from '@/components/modal.vue'


const isDate = (value) => moment(value, 'MM.YYYY', true).isValid()

export default {
  name: "hours",
  components: {
    autocomplete,
    modal
  },
  data() {
    return {
      firms: [],
      workers: [],
      historys: [],
      hideHistory: false,
      month: '',
      hoursErr: 0,
      newSalary: {
        Worker: {
          Id: null,
          Name: ''
        },
        Firm: 'None',
        MonthStart: null,
        MonthEnd: null,
        Hours: ''
      },
      firmNone: {
        Name: 'None',
        Id: null
      },
      selected: null
    }
  },
  watch: {
    month(value) {
      this.newSalary.MonthStart = moment(value, 'MM.YYYY').valueOf();
      this.newSalary.MonthEnd = moment(value, 'MM.YYYY').add(1, 'months').valueOf();
      this.fetchAutocompleteWorkers();
      this.fetchSalaryHistory();
      this.$v.newSalary.$reset();
      this.newSalary.Worker.Name = '';
      this.newSalary.Worker.Id = '';
      this.newSalary.Firm = 'None';
      this.newSalary.Hours = '';
      this.materializeInit();
    }
  },
  validations: {
    month: {
      required,
      isDate(value) {
        return isDate(value)
      },
    },
    newSalary: {
      Worker: {
        Name: {
          required
        }
      },
      Hours: {
        required,
        isNumber: (value) => {
          return !isNaN(parseFloat(value.replace(',','.')))
        },
      },
      Firm: {
        notNone(value) {
          return value !== 'None'
        }
      }
    }
  },
  created() {
    let firms = this.firms;
    let workers = this.workers;
    let historys = this.historys;

    this.materializeInit();

    ipcRenderer.send("printFirms");
    ipcRenderer.on("printFirms:res", function (evt, result) {
      firms.push(result)
    });

    ipcRenderer.on("autocompleteWorkers:res", function (evt, result) {
      workers.push(result);
    });

    this.fetchSalaryHistory();
    ipcRenderer.on("fetchSalaryHistory:res", function (evt, result) {
      historys.push(result);
    });
  },
  methods: {
    saveSalary() {
      let req = ipcRenderer.sendSync("add-salary", this.newSalary);
      let vm = this;

      if (req === true) {
        this.fetchSalaryHistory();
        this.fetchAutocompleteWorkers();
        this.materializeInit();
        this.newSalary.Worker.Name = '';
        this.newSalary.Worker.Id = '';
        this.newSalary.Hours = '';
        this.$refs.workerField.clear();
        this.$refs.workerField.onFocus();
      } else if (req === 'err_exist') {
        this.hoursErr = 1;
        setTimeout(function () {
          vm.hoursErr = false;
        }, 8000);
      }
    },
    fetchAutocompleteWorkers() {
      this.workers.splice(0, this.workers.length);
      ipcRenderer.send('autocompleteWorkers', this.newSalary);
    },
    fetchSalaryHistory() {
      this.historys.splice(0, this.historys.length);
      ipcRenderer.send("fetchSalaryHistory", this.newSalary.MonthStart)
    },
    deleteHistory(history) {
      if (ipcRenderer.sendSync('delete-history', history.Id)) {
        this.fetchSalaryHistory();
      }
    },
    materializeInit() {
      /* eslint-disable */
      (function ($) {
        $(function () {
          $('select').formSelect();
        });
      })(jQuery);
      /* eslint-enable */
    },
    hoursCheckSalary(hour) {
      return !hour.Report_id ? 1 : 0
    }
  },
  filters: {
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format('MM.YYYY')
    }
  }
}
</script>

<style lang="stylus">
@import "../styles/salary.styl"
</style>
