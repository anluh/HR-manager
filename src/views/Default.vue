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

      <h3>Workers: {{ workers }}</h3>
      <h3>Firms: {{ firms }}</h3>
    </div>

  </div>
</template>

<script>
// @ is an alias to /src

import {CreateNewDataBase, ImportDataBase, ExportDataBase} from '../database'
import modal from "../components/modal";

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
      workers: 0,
      firms: 0
    }
  },
  mounted() {
    ipcRenderer.on('ChangeCurrentDB:res', () => {
      window.location.reload(true)
    })

    ipcRenderer.send('getWorkersCount');
    ipcRenderer.on('getWorkersCount:res', (event, result) => {
      this.workers = result
    });
    ipcRenderer.send('getFirmsCount');
    ipcRenderer.on('getFirmsCount:res', (event, result) => {
      this.firms = result
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
    }
  }

}
</script>

<style lang="stylus">
  .database
    display: flex

    &>*
      //width: 200px
      margin-right: 20px

      .worker-btn
        width: 100%
</style>
