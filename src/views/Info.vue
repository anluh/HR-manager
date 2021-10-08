<template>
  <div class="home">

    <div class="page-title">
      <h3>Info</h3>
    </div>

    <div class="view-wrapper">
      <h4>Configure database</h4>
      <div class="database">
        <div>
          <modal @submit="CreateDatabase()" submit-btn="Create">
            <button class="btn-small waves-effect waves-light">Create</button>
            <div slot="popup-text"> All data will be loosed, do you really want to create new database?</div>
          </modal>
        </div>
        <button class="btn-small waves-effect waves-light" @click="ImportDatabase()">Import</button>
        <button class="btn-small waves-effect waves-light" @click="ExportDatabase()">Export</button>
      </div>
    </div>

    <div class="view-wrapper">
      <router-link to="/add/worker" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
        <i class="fas fa-plus" style="font-size: 18px;"></i>
      </router-link>

      <div class="filter-wrapper">
        <form class="filter-form">
          <div class="input-field">
            <label>Worker</label>
            <multiselect
                v-model="filters.worker"
                label="Name"
                placeholder=""
                :options="workers">
            </multiselect>
          </div>

          <div class="input-field">
            <label>Firm</label>
            <multiselect
                v-model="filters.firm"
                label="Name"
                placeholder=""
                :options="firms">
            </multiselect>
          </div>

          <div class="input-field add-salary__month">
            <label>Month</label>
            <date-picker type="month" v-model="filters.month" placeholder="MM.YYYY" format="MM.YYYY"
                         value-type="MM.YYYY" :append-to-body="false"/>
          </div>

        </form>
      </div>

      <div class="report-list" id="print-report">
        <div class="">
          <h5 class="print-title">Výplatní list</h5>
<!--          <div class="print-data">datum: {{ today }}</div>-->
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
            <td>{{ reportWorker.Rate | numberFormatter }}</td>
            <td>{{ reportWorker.Salary | numberFormatter }}</td>
            <td>{{ reportWorker.Insurance | numberFormatter }}</td>
            <td>{{ reportWorker.Deposit | numberFormatter }}</td>
            <td>{{ reportWorker.Other | numberFormatter }}</td>
            <td>{{ reportWorker.Total | numberFormatter }}</td>
          </tr>
          </tbody>
        </table>
        <h5 class="total-money"><span class="no-print">Total: </span></h5>
        <div class="submit-btns no-print">
          <button v-print="'#print-report'" class="waves-effect waves-light btn">
            <i class="fas fa-print"></i>
            Print
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<script>
// @ is an alias to /src

import {CreateNewDataBase, ImportDataBase, ExportDataBase} from '../database'
import modal from "../components/modal";
import moment from "moment";

const electron = require('electron');
const {ipcRenderer} = electron;
const dialog = require('electron').remote.dialog

export default {
  name: 'default',
  components: {
    modal
  },
  data() {
    return {
      workers: [],
      firms: [],
      report: [],
      filters: {
        worker: '',
        firm: '',
        month: ''
      },
      tableTrans: {
        eng: ['Name', 'Month', 'Firm', 'Hours', 'Hour Rate', 'Salary', 'Insurance', 'Deposit', 'Other', 'Total'],
        czech: ['Jméno', 'Měsíc', 'Firma', 'Počet h.', 'Kč/h', 'Celkem', 'Pojištění', 'Záloha', 'Jiné', 'K vyplacení']
      }
    }
  },
  watch: {
    filters: {
      deep: true,
      handler() {
        this.FetchInfoHistory()
      }
    }
  },
  created() {
    ipcRenderer.on('ChangeCurrentDB:res', () => {
      window.location.reload(true)
    })

    ipcRenderer.send('getInfoWorkers');
    ipcRenderer.on('getInfoWorkers:res', (event, result) => {
      this.workers = result
    });
    ipcRenderer.send('getInfoFirms');
    ipcRenderer.on('getInfoFirms:res', (event, result) => {
      this.firms = result
    });

    ipcRenderer.on('fetchInfoHistory:res', (event, result) => {
      this.report = result
    });
  },
  methods: {
    CreateDatabase() {
      console.log('Creating database file...')
      CreateNewDataBase(() => {
        window.location.reload(true)
      })
    },
    async ImportDatabase() {
      let importDatabasePath = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {name: 'Database', extensions: ['sqlite']}
        ]
      })
      ImportDataBase(...importDatabasePath.filePaths)
    },
    async ExportDatabase() {
      let saveDatabasePath = await dialog.showSaveDialog({
        properties: ['openFile'],
        filters: [
          {name: 'Database', extensions: ['sqlite']}
        ]
      })
      ExportDataBase(saveDatabasePath.filePath + '.sqlite')
    },
    FetchInfoHistory() {
      let query = {}
      if(this.filters.worker) query.worker = this.filters.worker.Name
      if(this.filters.firm) query.firm = this.filters.firm.Name
      query.start = moment(this.filters.month, 'MM.YYYY').valueOf() || '';
      query.end = moment(this.filters.month, 'MM.YYYY').add(1, 'day').valueOf() || '';

      ipcRenderer.send('fetchInfoHistory', query)
    }
  },
  filters: {
    numberFormatter(value) {
      return value ? parseFloat(value).toLocaleString().replace(',', ' ') : 0;
    },
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format('MM.YYYY')
    },
  }
}
</script>

<style lang="stylus">
.database
  display: flex

  & > *
    //width: 200px
    margin-right: 20px

    .worker-btn
      width: 100%
</style>
