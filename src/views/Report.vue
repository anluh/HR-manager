<template>
    <div class="report">
        <div class="page-title">
            <h3>Report</h3>
        </div>

        <div class="select-worker page-wrapper">
            <div class="input-field select-worker__month">
                <input id="select-worker__month"
                       v-model.lazy="month"
                       :class="{ invalid: !$v.month.isDate && $v.month.required, valid: $v.month.isDate && $v.month.required, disabled: disableFirms }"
                       type="text">
                <label for="select-worker__month">Month</label>
                <span class="error danger" v-show="!$v.month.isDate && $v.month.required">Enter valid month MM.YYYY</span>
            </div>

            <div class="select-worker__lists" :class="{ disabled: !$v.month.isDate || !$v.month.required }">
                <div class="firm-list" :class="{ selected: disableFirms }">
                    <h5 class="title">Firms List</h5>
                    <div class="list-wrapper">
                        <div class="list-item"
                             v-for="(firm, index) in firms"
                             @click="fetchWorkers(firm)"
                             :class="{ active: firm.active }"
                             :key="index">
                            <span>{{firm.Name}}</span>
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
                            <span>{{worker.Worker_name}}</span>
                            <i class="fas fa-user-plus"></i>
                        </div>
                    </div>
                </div>
            </div>


            <div class="report-list" id="print-report">
                <table class="striped report">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Name</th>
                        <th>Month</th>
                        <th>Hour Rate</th>
                        <th>Hours</th>
                        <th>Salary</th>
                        <th>Insurance</th>
                        <th>Deposit</th>
                        <th>Total</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr v-for="(reportWorker, index) in report" :key="index">
                        <td>{{ index + 1 }}</td>
                        <td>{{ reportWorker.Worker_name }}</td>
                        <td>{{ reportWorker.Month | dateFormatter}}</td>
                        <td class="rate-td">
                            <div class="input-field rate-input no-print">
                                <input v-model.lazy="reportWorker.Rate" @change="countTotal(reportWorker)" type="text">
                            </div>
                            <div class="print">{{ reportWorker.Rate }}</div>
                        </td>
                        <td>{{ reportWorker.Hours }}</td>
                        <td>{{ reportWorker.Salary }}</td>
                        <td>{{ reportWorker.Insurance }}</td>
                        <td>{{ reportWorker.Deposit }}</td>
                        <td>{{ reportWorker.Total }}</td>
                        <td class="no-print">
                            <a @click.prevent="deleteReport(reportWorker)" class="worker-btn"><i class="danger far fa-trash-alt"></i></a>
                        </td>
                    </tr>
                    </tbody>
                </table>
                <h5 class="total-money">Total: {{ total }} CZK</h5>
                <div class="submit-btns no-print">
                    <button class="waves-effect waves-light btn red" @click="reset()">RESET</button>
                    <button v-print="'#print-report'" class="waves-effect waves-light btn"><i class="fas fa-print"></i>Print</button>
                    <button @click="saveReport()" class="waves-effect waves-light btn"><i class="fas fa-save"></i>Save</button>
                </div>

            </div>

        </div>

    </div>
</template>

<script>
  import moment from 'moment';
  const {ipcRenderer} = require('electron');
  import { required } from 'vuelidate/lib/validators'
  // import modal from '@/components/modal.vue'

  const isDate = (value) => moment(value, 'MM.YYYY', true).isValid();

  export default {
    name: "report",
    data() {
      return {
        firms: [],
        workers: [],
        report: [],
        total: 0,
        disableFirms: 0,
        month: '',
        filter:{
          Month: null,
          Firm: ''
        }
      }
    },
    validations: {
      month:{
        required,
        isDate(value){
          return isDate(value)
        },
      }
    },
    watch: {
      month(value) {
        if(value){
          this.filter.Month = moment(value, 'MM.YYYY').valueOf();
        } else {
          this.filter.Month = ''
        }
        this.workers.splice(0,this.workers.length);
        this.firms.forEach((item) => {
          item.active = 0;
        })
      },
      report(value) {
        if(value.length > 0){
          this.disableFirms = 1
        } else {
          this.disableFirms = 0;
        }
      }
    },
    created() {
      let firms = this.firms;
      let workers = this.workers;

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        result["active"] = 0;
        firms.push(result)
      });

      ipcRenderer.on("reportFetchWorkers:res", function (evt, result) {
        result["active"] = 0;

        workers.push(result)
      });

      ipcRenderer.on("reportWorkerData:res", (evt, result) => {
        let hours = result.Hours;

        if(hours >= 0 && hours <= 100){
          result.Insurance = 100
        } else if(hours > 100 && hours <= 170){
          result.Insurance = 150
        } else if(hours > 170){
          result.Insurance = 200
        }

        this.report.push(result)
      });

    },
    methods: {
      fetchWorkers(firm){
        this.filter.Firm = firm.Name;
        this.workers.splice(0, this.workers.length);
        ipcRenderer.send('reportFetchWorkers', this.filter);

        this.firms.forEach((item) =>{
          item.active = 0;
        });
        firm.active = 1
      },
      addToReport(worker){
        ipcRenderer.send('reportWorkerData', worker);
      },
      deleteReport(report){
        this.report.splice(this.report.indexOf(report), 1);
        this.workers.forEach((worker)=>{
          if(worker.Id === report.Id){
            worker.active = 0;
          }
        })
      },
      reset(){
        this.workers.splice(0, this.workers.length);
        this.report.splice(0, this.report.length);
        this.month = '';
        this.disableFirms = 0;
        this.firms.forEach((firm)=>{
          firm.active = 0
        })
      },
      countTotal(reportItem){
        let rate = parseInt(reportItem.Rate);
        let total = 0;
        if(rate){
          total = rate * reportItem.Hours - reportItem.Insurance - reportItem.Deposit;
          reportItem.Salary = rate * reportItem.Hours;

          total > 0 ? reportItem.Total = total : reportItem.Total = 0;
        } else {
          reportItem.Total = '';
        }
        this.totalSalary();
      },
      totalSalary(){
        let total = 0;
        this.report.forEach((item) => {
          total+=item.Total;
        });
        !total ? this.total = 0 : this.total = total;
      },
      saveReport(){
        let currentTime = moment().valueOf();

        this.report.forEach((report) => {
          let query = {};
          query.Rate = report.Rate;
          query.Worker_id = report.Worker_id;

          report.Group = currentTime;

          report.Total === 0 ? query.Deposit = report.Deposit - report.Salary : query.Deposit = 0;

          console.log(query);

          ipcRenderer.send('newDepositRate', query);
          ipcRenderer.send('saveReport', report)
        })
      }
    },
    filters: {
      dateFormatter(value){
        return window.moment(parseInt(value)).format('MM.YYYY')
      }
    }
  }
</script>

<style lang="stylus" scoped>
    @import "../styles/variables.styl";
    @import "../styles/main.styl";
    @import "../styles/report.styl";

</style>
