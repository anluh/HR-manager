<template>
    <div class="home">

        <div class="page-title">
            <h3>Workers List</h3>
        </div>

        <div class="view-wrapper">

            <router-link to="/add/worker" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
                <i class="fas fa-plus" style="font-size: 18px;"></i>
            </router-link>


            <table class="striped">
                <thead>
                <tr>
                    <th>№</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Firm</th>
                    <th>Start</th>
                    <th>End</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="(worker, index) in workers" :key="worker.Id">
                    <td>{{ index + 1 }}</td>
                    <td>{{ worker.Name }}</td>
                    <td>{{ worker.Age }}</td>
                    <td>{{ worker.Sex }}</td>
                    <td>{{ worker.Firm }}</td>
                    <td>{{ worker.Start }}</td>
                    <td>{{ worker.End }}</td>
                    <td>
                        <router-link to="/edit/worker" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                        <button class="worker-btn" @click="deleteWorker(worker)"><i class="danger far fa-trash-alt"></i></button>
                    </td>
                </tr>
                </tbody>
            </table>

            <pagination
                    :current="pagination.currentPage"
                    :total="pagination.totalItems"
                    :per-page="pagination.perPage"
                    @page-changed="fetchWorkers">
            </pagination>

        </div>

    </div>
</template>

<script>
  // @ is an alias to /src
  import router from '../router'
  import HelloWorld from '@/components/HelloWorld.vue'
  import pagination from '@/components/pagination.vue'

  const electron = require('electron');
  const {ipcRenderer} = electron;


  export default {
    name: 'home',
    components: {
      HelloWorld,
      pagination
    },
    created() {
      let vm = this;
      let workers = this.workers;

      ipcRenderer.send('printWorkers', this.pagination);
      ipcRenderer.on("printWorkers:res", function (evt, result) {
        workers.push(result.rows);
        vm.pagination.totalItems = parseInt(result.totalItems);
      });
      router.push('/#/');
    },
    data() {
      return {
        workers: [],
        pagination: {
          totalItems: 0,
          perPage: 5,
          currentPage: 1
        }
      }
    },
    methods:{
      fetchWorkers(page){
        if(page > 0 && page<=Math.ceil(this.pagination.totalItems/this.pagination.perPage)){
          this.pagination.currentPage = page;
          this.workers.splice(0, this.workers.length);
          ipcRenderer.send('printWorkers', this.pagination)
        }
      },
      deleteWorker(worker){
        ipcRenderer.sendSync("delete-worker", worker.Id);
        this.workers.splice(this.workers.indexOf(worker), 1);
      }
    }
  }
</script>
