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
                      @submit.prevent="validateFilter; if(validateFilterCheck){fetchWorkersFilter(1); resetFilterValidation()}">

                    <div  v-show="filterBy.Field === 'Name'" class="input-field col s6 m6">
                        <input v-model="filterBy.Name" id="worker_name" type="text" class="validate" :class="{ invalid: $v.filterBy.Name.$dirty }" placeholder="Name">
                        <span class="field-error danger" v-if="$v.filterBy.Name.$dirty">Field is required</span>
                    </div>
                    <div v-show="filterBy.Field === 'Firm'" class="input-field col s12 m6">
                        <select v-model="filterBy.Firm">
                            <option value="None" selected>None</option>
                            <option :value="firm.Name" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">{{ firm.Name }}</option>
                        </select>
                    </div>

                    <div v-show="filterBy.Field === 'Date'" class="filter-form__date">
                        <div  class="input-field col s12 m6">
                            <input v-model.lazy="filterBy.Date.StartDate" class="date-filter" type="text" id="worker_start">
                            <label for="worker_start" class="">Start</label>
                        </div>
                        <div class="input-field col s12 m6">
                            <input v-model.lazy="filterBy.Date.EndDate" class="date-filter" type="text"  id="worker_end">
                            <label for="worker_end" class="">End</label>
                        </div>
                        <span class="danger" v-if="!this.$v.filterBy.Date.Start.required && !this.$v.filterBy.Date.End.required && this.$v.filterBy.Date.$dirty">Please enter date to filter</span>
                    </div>


                    <button class="filter-form__submit btn waves-effect"><i class="fas fa-search"></i>Filter</button>
                </form>

                <div class="activity-filter" >
                    <label>
                        <input v-model="activeFilter" class="with-gap" name="activity" value="" type="radio"  />
                        <span>All</span>
                    </label>
                    <label>
                        <input v-model="activeFilter" class="with-gap" name="activity" value="1" type="radio"  />
                        <span>Active</span>
                    </label>
                    <label>
                        <input v-model="activeFilter" class="with-gap" name="activity" value="0" type="radio"  />
                        <span>Inactive</span>
                    </label>
                </div>

            </div>

            <table class="striped table-list">
                <thead>
                <tr>
                    <th>№</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Sex</th>
                    <th>Firm</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Status</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="(worker, index) in workers" :key="index">
                    <td class="num">{{ indexOffset(index) }}</td>
                    <td>{{ worker.Name }}</td>
                    <td>{{ worker.Age | ageFromBirth }}</td>
                    <td>{{ worker.Sex }}</td>
                    <td>{{ worker.Firm }}</td>
                    <td>{{ worker.Start | dateFormatter }}</td>
                    <td>{{ worker.End | dateFormatter }}</td>
                    <td class="active" v-if="worker.Active === 1">active</td>
                    <td class="inactive" v-if="worker.Active === 0">inactive</td>
                    <td>
                        <router-link :to="{ name: 'editworker', params: { id: worker.Id, worker: worker } }" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                        <modal @submit="deleteWorker(worker)" submit-btn="Delete">
                            <i class="danger far fa-trash-alt"></i>
                            <div slot="popup-text">Do you want to delete this worker?</div>
                        </modal>
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
  import modal from '@/components/modal.vue'
  import pagination from '@/components/pagination.vue'
  import { required } from 'vuelidate/lib/validators'

  const electron = require('electron');
  const {ipcRenderer} = electron;


  export default {
    name: 'home',
    components: {
      pagination,
      modal
    },
    data() {
      return {
        workers: [],
        firms: [],
        activeFilter: '',
        filterBy:{
          Field: 'None',
          Name:'',
          Firm: 'None',
          Active: '',
          Date: {
            Start: '',
            StartDate: '',
            End: '',
            EndDate: ''
          }
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
        Date: {
          Start: {
            required
          },
          End: {
            required
          }
        }
      }
    },
    watch: {
      activeFilter(){
        this.filterBy.Active = this.activeFilter;
        this.activeFilterChanged(1);
      },
      'filterBy.Date.StartDate'(value){
        if(value) {
          this.filterBy.Date.Start = window.moment(value, 'DD.MM.YYYY').valueOf()
        } else {
          this.filterBy.Date.Start = ''
        }
      },
      'filterBy.Date.EndDate'(value){
        if(value) {
          this.filterBy.Date.End = window.moment(value, 'DD.MM.YYYY').valueOf()
        }else {
          this.filterBy.Date.End = ''
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

      // Just Active Filter
      ipcRenderer.on("workerFilterActive:res", function (evt, result) {
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
        return this.filterBy.Field === 'None' ? (this.filterBy.Active !== '' ? this.activeFilterChanged : this.fetchWorkers) : this.fetchWorkersFilter
      },
      validateFilter(){
        if(this.filterBy.Field === 'Name') {
          return this.$v.filterBy.Name.$touch();
        } else if(this.filterBy.Field === 'Date') {
          return this.$v.filterBy.Date.$touch();
        }
      },
      validateFilterCheck(){
        if(this.filterBy.Field === 'Name') {
          return !this.$v.filterBy.Name.$invalid;
        } else if(this.filterBy.Field === 'Firm') {
          return true;
        } else if(this.filterBy.Field === 'Date') {
          return this.$v.filterBy.Date.Start.required || this.$v.filterBy.Date.End.required
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
        this.validateFilter;
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
      activeFilterChanged(page){
        if(this.filterBy.Field === 'None'){
          if(this.filterBy.Active === ''){
            this.fetchWorkers(1);
          } else {
            this.pagination.currentPage = page;

            let query = {};
            query.pagination = this.pagination;
            query.filterBy = this.filterBy;

            this.workers.splice(0, this.workers.length);
            ipcRenderer.send('workerFilterActive', query)
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

          }); // end of document ready
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      },
      clearFilter(){
        this.filterBy.Name = '';
        this.filterBy.Firm= 'None';
        this.filterBy.Start= '';
        this.filterBy.End= '';
        this.filterBy.Date.StartDate = '';
        this.filterBy.Date.EndDate = '';
        this.pagination.currentPage = 1;
        this.$v.filterBy.$reset();
        this.workers.splice(0, this.workers.length);
        ipcRenderer.send('printWorkers', this.pagination);
      },
      indexOffset(index){
        return this.pagination.currentPage * this.pagination.perPage - this.pagination.perPage + index + 1;
      },
      resetFilterValidation(){
        this.$v.filterBy.Name.$reset();
        this.$v.filterBy.Firm.$reset();
        this.$v.filterBy.Date.$reset()
      }

    },
    filters:{
      ageFromBirth(val){
        let parts = val.split('.');
        let birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        let ageDate = new Date(Date.now() - birthDate.getTime());
        return Math.abs(ageDate.getFullYear() - 1970);
      },
      dateFormatter(value){
        if(value !== 'null') {
          return window.moment(parseInt(value)).format('DD.MM.YYYY')
        } else {
          return ''
        }
      }
    },
  }
</script>
