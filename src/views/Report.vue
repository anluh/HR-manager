<template>
  <div class="report">
    <div class="page-title">
      <h3>Report</h3>
    </div>

    <div class="select-worker page-wrapper">
      <div class="tabs">
        <div @click="changeFilter()" :class="{ active: !tab }" class="tabs__item">Firms</div>
        <div @click="changeFilter()" :class="{ active: tab }" class="tabs__item">Workers</div>
      </div>

      <div class="select-worker-wrapper">
        <div class="input-field select-worker__month">
          <label>Month</label>
          <date-picker type="month" v-model="month" placeholder="MM.YYYY" format="MM.YYYY" value-type="MM.YYYY"
                       :append-to-body="false"/>
        </div>

        <div v-if="tab" class="select-worker__auto">
          <div class="input-field">
            <label>Worker</label>
            <multiselect
                v-model="workerAutocomplete"
                label="reportView"
                placeholder="Worker"
                :options="notActiveWorkers">
            </multiselect>
          </div>
          <button class="waves-effect waves-light btn save" @click="addToReportAutocomp">Add</button>
        </div>

      </div>

      <div v-if="!tab" class="select-worker__lists" :class="{ disabled: !$v.month.required }">
        <div class="firm-list" :class="{ selected: disableFirms }">
          <h5 class="title">Firms List</h5>
          <div class="list-wrapper">
            <div class="list-item"
                 v-for="(firm, index) in firms"
                 @click="fetchWorkers(firm)"
                 :class="{ active: firm.active }"
                 :key="index">
              <span>{{ firm.Name }}</span>
              <i class="fas fa-plus"></i>
            </div>
          </div>
        </div>
        <div class="worker-list">
          <h5 class="title">Workers List</h5>
          <div class="list-wrapper">
            <div class="list-item"
                 v-for="(worker, index) in workers"
                 :key="index"
                 :class="{ active: worker.active }"
                 @click="addToReport(worker); worker.active=1">
              <span>{{ worker.Worker_name }}</span>
              <i class="fas fa-user-plus"></i>
            </div>
          </div>
        </div>
      </div>


      <div class="report-list" id="print-report">
        <div class="">
          <h5 class="print-title">Výplatní list</h5>
          <div class="print-data">datum: {{ today }}</div>
        </div>

        <table class="striped report">
          <thead>
          <tr>
            <th v-for="item in tableTrans.czech" :key="item">{{ item }}</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(reportWorker, index) in report" :key="index">
            <td>{{ reportWorker.Worker_name }}</td>
            <td>{{ reportWorker.Month | dateFormatter }}</td>
            <td>{{ reportWorker.Firm }}</td>
            <td>{{ reportWorker.Hours | numberFormatter }}</td>
            <td class="rate-td">
              <div class="input-field rate-input no-print">
                <input :class="{ disabled: reportWorker.disableDelete }"
                       v-model="reportWorker.Rate"
                       @load="countTotal(reportWorker)"
                       @change="countTotal(reportWorker)"
                       type="text">
              </div>
              <div class="print">{{ reportWorker.Rate | numberFormatter }}</div>
            </td>
            <td>{{ reportWorker.Salary | numberFormatter }}</td>
            <td>
              <div class="input-field rate-input no-print">
                <input :class="{ disabled: reportWorker.disableDelete }"
                       v-model="reportWorker.Insurance"
                       @load="countTotal(reportWorker)"
                       @change="countTotal(reportWorker)"
                       type="text">
              </div>
              <div class="print">{{ reportWorker.Insurance | numberFormatter }}</div>
            </td>
            <td>{{ reportWorker.Deposit | numberFormatter }}</td>
            <td class="rate-td">
              <div class="input-field rate-input no-print">
                <input :class="{ disabled: reportWorker.disableDelete }"
                       v-model="reportWorker.Other"
                       @change="countTotal(reportWorker)" type="text">
              </div>
              <div class="print">{{ reportWorker.Other | numberFormatter }}</div>
            </td>
            <td>{{ reportWorker.Total | numberFormatter }}</td>
            <td class="no-print">
              <a v-if="!reportWorker.disableDelete" @click.prevent="deleteReport(reportWorker)" class="worker-btn"><i
                  class="danger far fa-trash-alt"></i></a>
            </td>
          </tr>
          </tbody>
        </table>
        <h5 class="total-money"><span class="no-print">Total: </span>{{ total | numberFormatter }}</h5>
        <div class="submit-btns no-print">
          <button class="waves-effect waves-light btn red" @click="reset()">RESET</button>
          <button v-print="'#print-report'" class="waves-effect waves-light btn"><i class="fas fa-print"></i>Print
          </button>
          <div class="button-wrapper">
            <button :disabled="checkRate()" @click="saveReport(); reset();"
                    :class="{saveHint: checkRate(), active: saveHint}" class="waves-effect waves-light btn"><i
                class="fas fa-save"></i>Save
            </button>
            <span><i v-if="checkRate()" @click="saveHint = !saveHint" class="fas fa-info-circle"></i></span>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>

<script>
import moment from 'moment';

const {ipcRenderer} = require('electron');
import {required} from 'vuelidate/lib/validators'
import autocomplete from '@/components/autocompleteReport.vue'

const isDate = (value) => moment(value, 'MM.YYYY', true).isValid();

export default {
  name: "report",
  components: {
    autocomplete
  },
  data() {
    return {
      firms: [],
      workers: [],
      report: [],
      tab: true,
      workerAutocomplete: {},
      total: 0,
      disableFirms: 0,
      rateIsEmpty: false,
      saveHint: false,
      month: '',
      today: '',
      filter: {
        Month: null,
        Firm: ''
      },
      tableTrans: {
        eng: ['Name', 'Month', 'Firm', 'Hours', 'Hour Rate', 'Salary', 'Insurance', 'Deposit', 'Other', 'Total'],
        czech: ['Jméno', 'Měsíc', 'Firma', 'Počet h.', 'Kč/h', 'Celkem', 'Pojištění', 'Záloha', 'Jiné', 'K vyplacení']
      }
    }
  },
  validations: {
    month: {
      required,
      isDate(value) {
        return isDate(value)
      },
    }
  },
  computed: {
    notActiveWorkers() {
      return this.workers.filter(i => i.active === 0)
    }
  },
  watch: {
    month(value) {
      if (value) {
        this.filter.Month = moment(value, 'MM.YYYY').valueOf();
      } else {
        this.filter.Month = ''
      }
      this.workers = [];
      this.firms.forEach((item) => {
        item.active = 0;
      });

      if (this.tab === true) {
        let query = {}
        query.start = moment(value, 'MM.YYYY').valueOf()
        query.end = moment(this.month, 'MM.YYYY').add(1, 'day').valueOf()

        if (this.month) ipcRenderer.send('reportWorkerAutocomplete', query);
      }
    },
    report: {
      deep: true,
      handler() {
        this.totalSalary();
        this.checkRate();
      }
    }
  },
  created() {
    ipcRenderer.on("reportWorkerAutocomplete:res", (evt, result) => {
      // Check if worker report already in the report list.
      // let exist = false;
      // if (vm.report.length !== 0) {
      //     vm.report.forEach((item) => {
      //         if (result.Worker_id === item.Worker_id && result.Month === item.Month && result.Firm === item.Firm) exist = true
      //     })
      //     if(!exist) workers.push(result)
      // } else {
      //     workers.push(result)
      // }

      this.workers = result.map(i => {
        i.reportView = i.Worker_name + ' | ' + i.Firm
        i.active = 0
        return i
      })

    });

    ipcRenderer.send("printActiveFirms");
    ipcRenderer.on("printActiveFirms:res", (evt, result) => {
      this.firms = result.map(i => {
        i.active = 0
        return i
      })
    });

    ipcRenderer.on("reportFetchWorkers:res", (evt, result) => {
      let exist = this.report.find((item) => { // highlight selected workers in `workers list`
        return item.Worker_id === result.Worker_id && item.Firm === result.Firm && item.Month === result.Month
      });

      exist ? result["active"] = 1 : result["active"] = 0;

      this.workers.push(result)
    });

    ipcRenderer.on("reportWorkerData:res", (evt, result) => {

      // let hours = result.Hours;
      // if(hours >= 0 && hours <= 100){
      //   result.Insurance = 100
      // } else if(hours > 100 && hours <= 170){
      //   result.Insurance = 150
      // } else if(hours > 170){
      //   result.Insurance = 200
      // }

      result.Insurance = 0
      result.Other = 0
      result.Hours = parseFloat(('' + result.Hours).replace(',', '.'))


      if (!result.Deposit) {
        result.Deposit = 0;
      } else {
        this.report.forEach((item) => {
          if (item.Worker_id === result.Worker_id) {
            item.disableDelete = true;
          }
          if (item.Worker_id === result.Worker_id && parseFloat(item.Total) === 0) {
            result.Deposit -= item.Salary - item.Insurance;
          } else if (item.Worker_id === result.Worker_id && parseFloat(item.Total) !== 0) {
            result.Deposit = 0;
          }
        })
      }

      let rate = parseFloat(result.Rate);
      let total = 0;
      if (rate) {
        total = rate * result.Hours - result.Insurance - result.Deposit;
        result.Salary = rate * result.Hours;

        total > 0 ? result.Total = total : result.Total = 0;
      } else {
        result.Total = '';
      }

      this.report.push(result)
      this.workerAutocomplete = ''
    });

    // Print today date
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = dd + '.' + mm + '.' + yyyy;
    this.today = today;
  },
  methods: {
    changeFilter() {
      this.tab = !this.tab;
      this.report = [];
      this.month = ''
    },
    fetchWorkers(firm) {
      let query = {}
      this.workers = []
      query.firm = firm.Name
      query.start = moment(this.month, 'MM.YYYY').valueOf()
      query.end = moment(this.month, 'MM.YYYY').add(1, 'day').valueOf()

      ipcRenderer.send('reportFetchWorkers', query);

      this.firms.forEach((item) => {
        item.active = 0;
      });
      firm.active = 1
    },
    addToReport(worker) {
      ipcRenderer.send('reportWorkerData', worker);
    },
    addToReportAutocomp() {
      this.addToReport(this.workerAutocomplete)
      this.workers[this.workers.indexOf(this.workerAutocomplete)].active = 1
    },
    deleteReport(report) {
      this.report.splice(this.report.indexOf(report), 1);
      if (this.tab) {
        // Add back to autocomplete
        const index = this.workers.find(i => i.Worker_id === report.Worker_id && i.Firm === report.Firm);
        this.workers[this.workers.indexOf(index)].active = 0
      }

      let test = this.report.slice().reverse().find((item) => {
        return item.Worker_id === report.Worker_id
      });
      if (test) this.report[this.report.indexOf(test)].disableDelete = false;


      this.workers.forEach((worker) => {
        if (worker.Id === report.Id) {
          worker.active = 0;
        }
      })
    },
    reset() {
      this.workers.splice(0, this.workers.length);
      this.report.splice(0, this.report.length);
      this.month = '';
      this.disableFirms = 0;
      this.firms.forEach((firm) => {
        firm.active = 0
      })
    },
    countTotal(reportItem) {
      let rate = parseFloat(reportItem.Rate);
      let total = 0;
      let other = 0;
      if (reportItem.Other) other = parseFloat(reportItem.Other);

      if (rate) {
        total = rate * reportItem.Hours - reportItem.Insurance - reportItem.Deposit + other;
        reportItem.Salary = rate * reportItem.Hours;

        total > 0 ? reportItem.Total = total : reportItem.Total = 0;
      } else {
        reportItem.Total = '';
      }
      this.totalSalary();
    },
    totalSalary() {
      let total = 0;
      this.report.forEach((item) => {
        if (item.Total) total += item.Total
      });
      !total ? this.total = 0 : this.total = total;
    },
    checkRate() {
      let check = true;
      if (this.report.length <= 0) check = false;
      this.report.forEach((item) => {
        if (!item.Rate || !parseFloat(item.Rate)) check = false;
      });

      return !check;
    },
    saveReport() {
      this.report.forEach((report) => {
        let query = {};
        query.Rate = report.Rate;
        query.Worker_id = report.Worker_id;

        report.Total === 0 ? query.Deposit = report.Deposit - report.Salary + report.Insurance : query.Deposit = 0;

        ipcRenderer.send('newDepositRate', query);
        ipcRenderer.send('saveReport', report);
      })
    }

  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners('reportWorkerData:res');
  },
  filters: {
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format('MM.YYYY')
    },
    numberFormatter(value) {
      return value ? parseFloat(value).toLocaleString().replace(',', ' ') : 0;
    }
  }
}
</script>

<style lang="stylus" scoped>
@import "../styles/variables.styl";
@import "../styles/main.styl";
@import "../styles/report.styl";

</style>
