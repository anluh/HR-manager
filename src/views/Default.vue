<template>
  <div class="home">

    <div class="page-title">
      <h3>Info</h3>
    </div>

    <div class="view-wrapper">

      <h3>Workers: {{ workers }}</h3>
      <h3>Firms: {{ firms }}</h3>

      <div><button class="btn-large waves-effect waves-light" @click="CreateDatabase()">Create new database</button></div>
      <div><button class="btn-large waves-effect waves-light" @click="ImportDatabase()">Import database</button></div>
      <div><button class="btn-large waves-effect waves-light" @click="ExportDatabase()">Export database</button></div>
    </div>

  </div>
</template>

<script>
// @ is an alias to /src

import {CreateNewDataBase, ImportDataBase, ExportDataBase} from '../database'

const electron = require('electron');
const {ipcRenderer} = electron;
const dialog = require('electron').remote.dialog

export default {
  name: 'default',
  data() {
    return {
      workers: 0,
      firms: 0
    }
  },
  created() {
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
    ImportDatabase() {
      let importDatabasePath = dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          {name: 'Database', extensions: ['sqlite']}
        ]
      })

      ImportDataBase(...importDatabasePath)
    },
    ExportDatabase() {
      let saveDatabasePath = dialog.showSaveDialog({
        properties: ['openFile'],
        filters: [
          {name: 'Database', extensions: ['sqlite']}
        ]
      })
      ExportDataBase(saveDatabasePath)
    }
  }

}
</script>
