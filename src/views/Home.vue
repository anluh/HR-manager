<template>
    <div class="home">

        <div class="page-title">
            <h3>Workers List</h3>
        </div>

        <div class="view-wrapper">

            <router-link to="/add/worker" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
                <i class="fas fa-plus" style="font-size: 18px;"></i>
            </router-link>

            <div class="filter-wrapper">

                <div class="filter-by input-field col s12 m6">
                    <span>Filter By</span>
                    <select v-model="filterBy.Field" @change="clearFilter">
                        <option value="None">None</option>
                        <option value="Name">Name</option>
                        <option value="Firm">Firm</option>
                        <option value="Date">Date</option>
                    </select>
                </div>


                <form class="filter-form"
                      v-show="filterBy.Field !== 'None'"
                      @submit.prevent="validateFilter; if(validateFilterCheck){fetchWorkersFilter(1); $v.filterBy.$reset()}">

                    <div  v-show="filterBy.Field === 'Name'" class="input-field col s6 m6">
                        <input v-model="filterBy.Name" id="worker_name" type="text" class="validate" :class="{ invalid: $v.filterBy.Name.$dirty }" placeholder="Name">
                        <span class="field-error danger" v-if="$v.filterBy.Name.$dirty">Field is required</span>
                    </div>
                    <div v-show="filterBy.Field === 'Firm'" class="input-field col s12 m6">
                        <select v-model="filterBy.Firm">
                            <option value="" selected disabled>Chose Firm</option>
                            <option :value="firm.Name" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">{{ firm.Name }}</option>
                        </select>
                        <span class="field-error danger" v-if="$v.filterBy.Firm.$dirty">Field is required</span>
                    </div>

                    <div v-show="filterBy.Field === 'Date'" class="filter-form__date">
                        <div  class="input-field col s12 m6">
                            <input @change="saveStartDate()" type="text" class="datepicker" id="worker_start">
                            <label for="worker_start" class="">Start</label>
                        </div>
                        <div class="input-field col s12 m6">
                            <input @change="saveEndDate()" type="text" class="datepicker"  id="worker_end">
                            <label for="worker_end" class="">End</label>
                        </div>
                    </div>

                    <button class="filter-form__submit btn waves-effect"><i class="fas fa-search"></i>Filter</button>
                </form>

            </div>

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
                <tr v-for="(worker, index) in workers" :key="index">
                    <td>{{ indexOffset(index) }}</td>
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

            <div class="pagination-section">
                <div class="items-per-page">
                    <span>Items per page</span>
                    <div class="input-field col s12 m6">
                        <select v-model="pagination.perPage" @change="fetchWorkers(1)">
                            <option value="10" selected>10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>
                <pagination
                        :current="pagination.currentPage"
                        :total="pagination.totalItems"
                        :per-page="pagination.perPage"
                        @page-changed="paginationMethod">
                </pagination>
            </div>

        </div>

    </div>
</template>

<script>
  // @ is an alias to /src
  // import router from '../router'
  import pagination from '@/components/pagination.vue'
  import { required } from 'vuelidate/lib/validators'

  const electron = require('electron');
  const {ipcRenderer} = electron;


  export default {
    name: 'home',
    components: {
      pagination
    },
    data() {
      return {
        workers: [],
        firms: [],
        filterBy:{
          Field: 'None',
          Name:'',
          Firm: '',
          Start: '',
          StartFormated: '',
          End: '',
          EndFormated: ''
        },
        pagination: {
          totalItems: 0,
          perPage: 10,
          currentPage: 1
        }
      }
    },
    validations:{
      filterBy:{
        Name:{
          required
        },
        Firm:{
          required
        }
      }
    },
    created() {
      let vm = this;
      let workers = this.workers;
      let firms = this.firms;

      this.materializeInit();

      ipcRenderer.send('printWorkers', this.pagination);
      ipcRenderer.on("printWorkers:res", function (evt, result) {
        workers.push(result.rows);
        vm.pagination.totalItems = parseInt(result.totalItems);
      });

      ipcRenderer.on("printWorkersFilter:res", function (evt, result) {
        workers.push(result.rows);
        vm.pagination.totalItems = parseInt(result.totalItems);
      });

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        firms.push(result)
      });

    },
    computed:{
      paginationMethod(){
        return this.filterBy.Field === 'None' ? this.fetchWorkers : this.fetchWorkersFilter
      },
      validateFilter(){
        if(this.filterBy.Field === 'Name') {
          console.log("name")
          return this.$v.filterBy.Name.$touch();
        } else if(this.filterBy.Field === 'Firm') {
          return this.$v.filterBy.Firm.$touch();
        } else if(this.filterBy.Field === 'Date') {
          // return this.$v.filterBy.Date.$touch();
          return 0
        }
      },
      validateFilterCheck(){
        if(this.filterBy.Field === 'Name') {
          return !this.$v.filterBy.Name.$invalid;
        } else if(this.filterBy.Field === 'Firm') {
          return !this.$v.filterBy.Firm.$invalid;
        } else if(this.filterBy.Field === 'Date') {
          // return !this.$v.filterBy.Date.$invalid;
          return 0
        }
      },

    },
    methods:{
      fetchWorkers(page){
        if(page > 0 && page<=Math.ceil(this.pagination.totalItems/this.pagination.perPage)){
          this.pagination.currentPage = page;
          this.workers.splice(0, this.workers.length);
          ipcRenderer.send('printWorkers', this.pagination)
        }
      },
      fetchWorkersFilter(page){
        // Validate
        this.validateFilter
        // Disable pagination if not valid
        if (this.validateFilterCheck) {
          if (page > 0 && page <= Math.ceil(this.pagination.totalItems / this.pagination.perPage)) {
            this.pagination.currentPage = page;

            let query = {};
            query.pagination = this.pagination;
            query.filterBy = this.filterBy;

            this.workers.splice(0, this.workers.length);
            ipcRenderer.send('printWorkersFilter', query)
          }
        }
      },
      deleteWorker(worker){
        ipcRenderer.sendSync("delete-worker", worker.Id);
        this.workers.splice(this.workers.indexOf(worker), 1);
      },
      materializeInit(){
        /* eslint-disable */
        // Initialize materialize elements
        (function($){
          $(function(){

            $('select').formSelect();
            $('.datepicker').datepicker({
              format: 'dd.mm.yyyy',
              autoClose: true
            });

          }); // end of document ready
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      },
      saveStartDate(){
        let vm = this;

        /* eslint-disable */
        (function($){
          vm.filterBy.StartFormated = $('#worker_start').val();
          let parts = vm.filterBy.StartFormated.split('.');

          vm.filterBy.Start = new Date(parts[2], parts[1] - 1, parts[0]);

          $('#worker_end').datepicker({
            minDate: vm.filterBy.Start,
            format: 'dd.mm.yyyy',
            autoClose: true
          });
        })(jQuery); // end of jQuery name space
        /* eslint-enable */

      },
      saveEndDate(){
        let vm = this;
        /* eslint-disable */
        (function($){
          vm.filterBy.EndFormated = $('#worker_start').val();
          let parts = vm.filterBy.EndFormated.split('.');
          vm.filterBy.End = new Date(parts[2], parts[1] - 1, parts[0]);
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      },
      clearFilter(){
        this.filterBy.Name = '';
        this.filterBy.Firm= '';
        this.filterBy.Start= '';
        this.filterBy.End= '';
        this.pagination.currentPage = 1;
        this.$v.filterBy.$reset();
        this.workers.splice(0, this.workers.length);
        ipcRenderer.send('printWorkers', this.pagination);
      },
      indexOffset(index){
        return this.pagination.currentPage * this.pagination.perPage - this.pagination.perPage + index + 1;
      },

    }
  }
</script>
