<template>
  <div class="worker-info">
    <div class="page-title">
      <back-button />
      <h3>{{ $t('worker') }} {{ $t('info') }}: {{ name }}</h3>
    </div>

    <div class="view-wrapper">
      <div class="current-stat">
        <div class="input-field">
          <label>{{ $t('year') }}</label>
          <date-picker
            type="year"
            :lang="datepickerLang"
            v-model="year"
            placeholder="YYYY"
            format="YYYY"
            value-type="timestamp"
            :append-to-body="false"
          />
        </div>
        <h5>
          {{ $t('current_deposit') }}:<span style="color: #26a69a"
            >{{ currentDeposit }} CZK</span
          >
        </h5>
      </div>

      <div class="info-wrapper">
        <div class="info-wrapper__item">
          <h3>{{ $t('hours') }}</h3>
          <table class="striped table-list" cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th>{{ $t('month') }}</th>
                <th>{{ $t('hours') }}</th>
                <th>{{ $t('firm') }}</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(history, index) in historys" :key="index">
                <td>{{ history.Month | dateFormatter }}</td>
                <td>{{ history.Hours }}</td>
                <td>{{ history.Firm }}</td>
                <td>
                  <div v-show="hoursCheckSalary(history)">
                    <router-link
                      @click.stop
                      :to="{
                        name: 'edithours',
                        params: { id: history.Id, history: history },
                      }"
                      class="worker-btn"
                      ><i class="fas fa-pencil-alt"></i
                    ></router-link>
                    <modal @submit="deleteHistory(history)" submit-btn="Delete">
                      <i
                        v-if="!history.Report_id"
                        class="danger far fa-trash-alt"
                      ></i>
                      <div slot="popup-text">
                        {{ $t('delete_item') }}
                      </div>
                    </modal>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="info-wrapper__item">
          <h3>{{ $t('deposit') }}</h3>
          <table class="striped table-list" cellspacing="0" cellpadding="0">
            <thead>
              <tr>
                <th>{{ $t('date') }}</th>
                <th>{{ $t('money') }}</th>
                <th>{{ $t('comment') }}</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(deposit, index) in deposits" :key="index">
                <td>{{ deposit.Date | dateFormatterDay }}</td>
                <td>{{ deposit.Money }}</td>
                <td>{{ deposit.Comment }}</td>
                <td>
                  <div v-show="depositsCheckSalary(deposit)">
                    <router-link
                      @click.stop
                      :to="{
                        name: 'editdeposit',
                        params: { id: deposit.Id, deposit: deposit },
                      }"
                      class="worker-btn"
                      ><i class="fas fa-pencil-alt"></i
                    ></router-link>
                    <modal @submit="deleteDeposit(deposit)" submit-btn="Delete">
                      <i
                        v-if="!deposit.Report_id"
                        class="danger far fa-trash-alt"
                      ></i>
                      <div slot="popup-text">
                        {{ $t('delete_item') }}
                      </div>
                    </modal>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="report-list worker-info-report">
        <h3>{{ $t('salaries') }}</h3>
        <table class="striped">
          <thead>
            <tr>
              <th>{{ $t('month') }}</th>
              <th>{{ $t('date') }}</th>
              <th>{{ $t('firm') }}</th>
              <th>{{ $t('hour_rate') }}</th>
              <th>{{ $t('hours') }}</th>
              <th>{{ $t('salaries') }}</th>
              <th>{{ $t('insurance') }}</th>
              <th>{{ $t('deposit') }}</th>
              <th>{{ $t('other') }}</th>
              <th>{{ $t('total') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(report, index) in reports" :key="index">
              <td>{{ report.Month | dateFormatter }}</td>
              <td>{{ report.Salary_date }}</td>
              <td>{{ report.Firm }}</td>
              <td>{{ report.Rate }}</td>
              <td>{{ report.Hours }}</td>
              <td>{{ report.Salary }}</td>
              <td>{{ report.Insurance }}</td>
              <td>{{ report.Deposit }}</td>
              <td>{{ report.Other }}</td>
              <td>{{ report.Total }}</td>
              <td>
                <modal @submit="deleteReport(report)" submit-btn="Delete">
                  <i class="danger far fa-trash-alt"></i>
                  <div slot="popup-text">
                   {{ $t('delete_item') }}
                  </div>
                </modal>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");
import modal from "@/components/modal.vue";
import moment from 'moment';

export default {
  name: "workerinfo",
  components: {
    modal,
  },
  data() {
    return {
      name: "",
      historys: [],
      deposits: [],
      reports: [],
      currentDeposit: 0,
      year: "",
    };
  },
  computed: {
    startEndYear() {
      return {
        start: this.year,
        end: moment(this.year).add(1, 'years').subtract(1, 'days').valueOf() || '',
      }
    },
    today() {
      return moment(moment(new Date()).format('YYYY')).valueOf(); // get full year 1.01
    },
  },
  watch: {
    year() {
      this.fetchWorkerInfo()
    }
  },
  mounted() {
    this.year = this.today

    this.fetchWorkerInfo();
    ipcRenderer.on("fetchWorkerInfo:res", (evt, result) => {
      this.historys = result
    });
    ipcRenderer.on("fetchWorkerInfoDeposits:res", (evt, result) => {
      this.deposits = result
    });
    ipcRenderer.on("fetchWorkerInfoReports:res", (evt, result) => {
      this.reports = result
    });
    ipcRenderer.on("fetchWorkerInfoCurrentDeposit:res", (evt, result) => {
      this.name = result.Name;
      this.currentDeposit = result.Deposit ? result.Deposit : 0
    });
  },
  filters: {
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format("MM.YYYY");
    },
    dateFormatterDay(value) {
      return window.moment(parseFloat(value)).format("DD.MM.YYYY");
    },
  },
  methods: {
    deleteHistory(history) {
      if (ipcRenderer.sendSync("delete-history", history.Id)) {
        this.fetchWorkerInfo();
      }
    },
    deleteDeposit(deposit) {
      if (ipcRenderer.sendSync("delete-deposit", deposit)) {
        this.fetchWorkerInfo();
      }
    },
    deleteReport(report) {
      let res = ipcRenderer.sendSync("delete-report", report);

      if (res) {
        this.fetchWorkerInfo();
      }
    },
    fetchWorkerInfo() {
      this.historys = [];
      this.deposits = [];
      this.reports = [];

      const query = {
        id: this.$route.params.id,
        ...this.startEndYear
      }
      ipcRenderer.send("fetchWorkerInfo", query);
    },
    hoursCheckSalary(hour) {
      return !hour.Report_id ? 1 : 0;
    },
    depositsCheckSalary(deposit) {
      if (!deposit.Report_id) {
        return 1;
      } else {
        return ipcRenderer.sendSync("deposit-check-salary", deposit);
      }
    },
  },
};
</script>

<style lang="stylus" scoped>

.current-stat
  display flex
  align-items center
  justify-content space-between


td:last-child
  text-align: right

.info-wrapper
  display: flex
  justify-content: space-between

  &__item
    flex-basis: 48%
  
.worker-info-report
  margin-top: 60px

  td:last-child
    text-align: left

</style>
