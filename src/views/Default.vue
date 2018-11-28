<template>
    <div class="home">

        <div class="page-title">
            <h3>Info</h3>
        </div>

        <div class="view-wrapper">

            <h3>Workers: {{ workers }}</h3>
            <h3>Firms: {{ firms }}</h3>
        </div>

    </div>
</template>

<script>
  // @ is an alias to /src

  const electron = require('electron');
  const {ipcRenderer} = electron;


  export default {
    name: 'default',
    data() {
      return {
        workers: 0,
        firms: 0
      }
    },
    created(){
      ipcRenderer.send('getWorkersCount');
      ipcRenderer.on('getWorkersCount:res', (event, result) => {
        this.workers = result
      });
      ipcRenderer.send('getFirmsCount');
      ipcRenderer.on('getFirmsCount:res', (event, result) => {
        this.firms = result
      });

    }

  }
</script>
