<template>
    <div class="worker-info">
        <div class="page-title">
                <h3>{{worker.Name}} Info</h3>
        </div>

        <div class="view-wrapper">
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
                        <router-link @click.stop :to="{ name: 'edithours', params: { id: history.Id, history: history, back: '/' } }" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                        <modal @submit="deleteHistory(history)" submit-btn="Delete">
                            <i class="danger far fa-trash-alt"></i>
                            <div slot="popup-text">Do you want to delete this item?</div>
                        </modal>
                    </td>
                </tr>
                </tbody>
            </table>
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
      }
    },
    created(){
      this.worker = this.$route.params.worker;
      let historys = this.historys;

      this.fetchWorkerInfo();
      ipcRenderer.on("fetchWorkerInfo:res", function (evt, result) {
        historys.push(result);
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
      fetchWorkerInfo(){
        this.historys.splice(0,this.historys.length);
        ipcRenderer.send("fetchWorkerInfo", this.worker.Id);
      }
    }
  }
</script>

<style scoped>

</style>
