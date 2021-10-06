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
        <label>Month</label>
        <date-picker type="month" v-model="month" placeholder="MM.YYYY" format="MM.YYYY" value-type="MM.YYYY" :append-to-body="false"/>
      </div>
      <form class="add-salary"
            @submit.prevent="$v.$touch(); if(!$v.newHourRow.$invalid){saveSalary(); $v.newHourRow.$reset()}">
        <div class="add-salary__data" :class="{ disabled: !$v.month.isDate || !$v.month.required }">
          <div class="input-field col s12 m6">
            <label>Firm</label>
            <multiselect
                v-model="newHourRow.Firm"
                label="Name"
                placeholder=""
                :options="firms" >
            </multiselect>
            <span class="error danger"
                  v-show="$v.newHourRow.$dirty && !$v.newHourRow.Firm.required">This field is required</span>
          </div>
          <div class="input-field">
            <label>Worker</label>
            <multiselect
                v-model="newHourRow.Worker"
                ref="workerField"
                label="Name"
                placeholder=""
                :options="workers" >
            </multiselect>
            <span class="error danger" v-show="$v.newHourRow.$dirty && !$v.newHourRow.Worker.Name.required">This field is required</span>
          </div>
          <div class="input-field">
            <label>Hours</label>
            <input type="text" v-model="newHourRow.Hours">
            <span class="error danger" v-show="$v.newHourRow.$dirty && !$v.newHourRow.Hours.required">This field is required</span>
            <span class="error danger"
                  v-show="$v.newHourRow.$dirty && $v.newHourRow.Hours.required && !$v.newHourRow.Hours.isNumber">Enter valid hours</span>
          </div>
          <button :disabled="!$v.month.isDate" class="waves-effect waves-light btn save">Save</button>
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
            <th></th>
            <th>Name</th>
            <th>Month</th>
            <th>Hours</th>
            <th>Firm</th>
            <th class="table-total">Total: <mark>{{ totalHours }} hr</mark></th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(history, index) in histories" :key="index">
            <td class="table-index">{{ index + 1 }}</td>
            <td>{{ history.Worker_name }}</td>
            <td>{{ history.Month | dateFormatter }}</td>
            <td>{{ history.Hours }}</td>
            <td>{{ history.Firm }}</td>
            <td>
              <div>
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
import moment from 'moment';
const {ipcRenderer} = require('electron');
import {required} from 'vuelidate/lib/validators'
import modal from '@/components/modal.vue'


const isDate = (value) => moment(value, 'MM.YYYY', true).isValid()

export default {
  name: "hours",
  components: {
    modal
  },
  data() {
    return {
      firms: [],
      workers: [],
      histories: [],
      hideHistory: false,
      month: '',
      hoursErr: 0,
      newHourRow: {
        Worker: {},
        Firm: {},
        MonthStart: null,
        MonthEnd: null,
        Hours: ''
      },
      selected: null
    }
  },
  validations: {
    month: {
      required,
      isDate(value) {
        return isDate(value)
      },
    },
    newHourRow: {
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
        required
      }
    }
  },
  computed: {
    totalHours() {
      return this.histories.reduce((a,i) => a = a + this.WithComaToFloat(i.Hours), 0).toFixed(1)
    },
    watchFilters() {
      return {
        firm: this.newHourRow.Firm,
        worker: this.newHourRow.Worker
      }
    }
  },
  watch: {
    watchFilters() {
      if (this.month) this.fetchHoursHistory()
      else this.histories = []
    },
    month() {
      this.newHourRow.MonthStart = moment(this.month, 'MM.YYYY').valueOf();
      this.newHourRow.MonthEnd = moment(this.month, 'MM.YYYY').add(1, 'day').valueOf();
      this.fetchAutocompleteWorkers();
      this.$v.newHourRow.$reset();
      this.newHourRow.Worker = '';
      this.newHourRow.Firm = '';
      this.newHourRow.Hours = '';

      if (this.month) this.fetchHoursHistory()
      else this.histories = []
    },
  },
  created() {
    ipcRenderer.send("printFirms");
    ipcRenderer.on("printFirms:res", (evt, result) => {
      this.firms = [...result]
    });

    ipcRenderer.on("autocompleteWorkers:res", (evt, result) => {
      this.workers = [...result];
    });

    ipcRenderer.on("fetchHoursHistory:res", (evt, result) => {
      this.histories = [...result];
    });
  },
  methods: {
    saveSalary() {
      let req = ipcRenderer.sendSync("add-salary", this.newHourRow);
      let vm = this;

      if (req === true) {
        this.fetchAutocompleteWorkers();
        this.newHourRow.Worker = {}
        this.newHourRow.Hours = '';
        this.fetchHoursHistory();
        this.$refs.workerField.$el.focus();
      } else if (req === 'err_exist') {
        this.hoursErr = 1;
        setTimeout(function () {
          vm.hoursErr = false;
        }, 8000);
      }
    },
    fetchAutocompleteWorkers() {
      this.workers.splice(0, this.workers.length);
      ipcRenderer.send('autocompleteWorkers', this.newHourRow);
    },
    fetchHoursHistory() {
      const query = {}

      if (this.month) query.month = {
          MonthStart: this.newHourRow.MonthStart,
          MonthEnd: this.newHourRow.MonthEnd,
        }
      if (this.newHourRow.Firm) query.firm = this.newHourRow.Firm.Name
      if (this.newHourRow.Worker) query.worker = this.newHourRow.Worker.Name

      ipcRenderer.send("fetchHoursHistory", query)
    },
    deleteHistory(history) {
      if (ipcRenderer.sendSync('delete-history', history.Id)) {
        this.fetchHoursHistory();
      }
    },
  },
  filters: {
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format('DD.MM.YYYY')
    }
  }
}
</script>

<style lang="stylus">
@import "../styles/salary.styl"

</style>
