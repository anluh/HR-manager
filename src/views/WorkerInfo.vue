<template>
    <div class="worker-info">
        <div class="page-title">
                <h3>{{worker.Name}} Info</h3>
        </div>

        <div class="view-wrapper">

            <div class="current-stat">
                <h5>Current Deposit: <span style="color: #26a69a">{{ worker.Deposit }} CZK</span></h5>
            </div>

            <div class="info-wrapper">

                <div class="info-wrapper__item">
                    <h3>Hours</h3>
                    <table class="striped table-list" cellspacing="0" cellpadding="0">
                        <thead>
                        <tr>
                            <th>Month</th>
                            <th>Hours</th>
                            <th>Firm</th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr v-for="(history, index) in historys" :key="index">
                            <td>{{ history.Month | dateFormatter}}</td>
                            <td>{{ history.Hours }}</td>
                            <td>{{ history.Firm }}</td>
                            <td>
                                <router-link @click.stop :to="{ name: 'edithours', params: { id: history.Id, history: history } }" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                                <modal @submit="deleteHistory(history)" submit-btn="Delete">
                                    <i class="danger far fa-trash-alt"></i>
                                    <div slot="popup-text">Do you want to delete this item?</div>
                                </modal>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div class="info-wrapper__item">
                    <h3>Deposits</h3>
                    <table class="striped table-list" cellspacing="0" cellpadding="0">
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Money</th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr v-for="(deposit, index) in deposits" :key="index">
                            <td>{{ deposit.Date | dateFormatter}}</td>
                            <td>{{ deposit.Money }}</td>
                            <td>
                                <router-link @click.stop :to="{ name: 'editdeposit', params: { id: deposit.Id, deposit: deposit } }" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                                <modal @submit="deleteDeposit(deposit)" submit-btn="Delete">
                                    <i class="danger far fa-trash-alt"></i>
                                    <div slot="popup-text">Do you want to delete this item?</div>
                                </modal>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <div class="report-list worker-info-report">
                <h3>Salaries</h3>
                <table class="striped">
                    <thead>
                    <tr>
                        <th>№</th>
                        <th>Month</th>
                        <th>Firm</th>
                        <th>Hour Rate</th>
                        <th>Hours</th>
                        <th>Salary</th>
                        <th>Insurance</th>
                        <th>Deposit</th>
                        <th>Total</th>
                    </tr>
                    </thead>

                    <tbody>
                    <tr v-for="(report, index) in reports" :key="index">
                        <td>{{ index + 1 }}</td>
                        <td>{{ report.Month | dateFormatter}}</td>
                        <td>{{ report.Firm }}</td>
                        <td>{{ report.Rate }}</td>
                        <td>{{ report.Hours }}</td>
                        <td>{{ report.Salary }}</td>
                        <td>{{ report.Insurance }}</td>
                        <td>{{ report.Deposit }}</td>
                        <td>{{ report.Total }}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

        </div>



    </div>

</template>

<script>
  const {ipcRenderer} = require('electron');
  import modal from '@/components/modal.vue'


  export default {
    name: "workerinfo",
    components: {
      modal
    },
    data(){
      return {
        worker: {},
        historys: [],
        deposits: [],
        reports: []
      }
    },
    created(){
      this.worker = this.$route.params.worker;
      let historys = this.historys;
      let deposits = this.deposits;
      let reports = this.reports;

      this.fetchWorkerInfo();
      ipcRenderer.on("fetchWorkerInfo:res", function (evt, result) {
        historys.push(result);
      });
      ipcRenderer.on("fetchWorkerInfoDeposits:res", function (evt, result) {
        deposits.push(result);
      })
      ipcRenderer.on("fetchWorkerInfoReports:res", function (evt, result) {
        reports.push(result);
      })
    },
    filters: {
      dateFormatter(value){
        return window.moment(parseInt(value)).format('MM.YYYY')
      }
    },
    methods: {
      deleteHistory(history){
        if(ipcRenderer.sendSync('delete-history', history.Id)){
          this.fetchWorkerInfo();
        }
      },
      deleteDeposit(deposit){
        if(ipcRenderer.sendSync('delete-deposit', deposit.Id)){
          this.fetchWorkerInfo();
        }
      },
      fetchWorkerInfo(){
        this.historys.splice(0, this.historys.length);
        this.deposits.splice(0, this.deposits.length);
        this.reports.splice(0, this.reports.length);
        ipcRenderer.send("fetchWorkerInfo", this.worker.Id);
      }
    }
  }
</script>

<style lang="stylus" scoped>
    td:last-child
        text-align right
    .info-wrapper
        display: flex
        justify-content: space-between
        &__item
            flex-basis: 48%

    .worker-info-report
        margin-top: 60px
        td:last-child
            text-align left
</style>
