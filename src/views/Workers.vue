<template>
  <div class="workers">

    <div class="page-title">
      <h3>Workers</h3>
    </div>

    <div class="view-wrapper">
      <router-link to="/add/worker" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
        <i class="fas fa-plus" style="font-size: 18px;"></i>
      </router-link>

      <div class="filter-wrapper">
        <form class="filter-form" @submit.prevent="fetchWorkersFilter()">
          <div class="input-field">
            <label>Name</label>
            <input v-model="filterBy.Name" type="text">
          </div>

          <div class="input-field">
            <label>Firm</label>
            <multiselect
                v-model="filterBy.Firm"
                label="Name"
                placeholder=""
                :options="firms">
            </multiselect>
          </div>

          <div class="input-field">
            <label>Start date</label>
            <date-picker type="date" v-model="filterBy.Date" placeholder="DD.MM.YYYY" format="DD.MM.YYYY"
                         value-type="timestamp" :append-to-body="false"/>
          </div>
          <div class="input-field">
            <label>Active</label>
            <multiselect
                v-model="filterBy.Active"
                label="label"
                placeholder=""
                :searchable="false"
                :options="activeOptions">
            </multiselect>
          </div>
        </form>
      </div>

      <div class="pagination-section">
        <div class="items-per-page">
          <span>Items per page</span>
          <div class="input-field col s12 m6">
            <multiselect
                v-model="pagination.perPage"
                class="per-page"
                placeholder=""
                :allow-empty="false"
                :searchable="false"
                :options="[30, 50, 80]">
            </multiselect>
          </div>
        </div>
        <pagination
            :current="pagination.currentPage"
            :total="pagination.totalItems"
            :per-page="pagination.perPage"
            @page-changed="PageChanged">
        </pagination>
      </div>


      <table class="striped table-list worker-list" cellspacing="0" cellpadding="0">
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
        <tr v-for="(worker, index) in workers" :key="index" @click.stop="workerInfo(worker)">
          <td class="num">{{ indexOffset(index) }}</td>
          <td>{{ worker.Name }}</td>
          <td>{{ worker.Age | ageFromBirth }}</td>
          <td>{{ worker.Sex }}</td>
          <td>{{ worker.Firm }}</td>
          <td>{{ worker.Start | dateFormatter }}</td>
          <td>{{ worker.End | dateFormatter }}</td>
          <td class="active" v-if="worker.Active === 1">active</td>
          <td class="inactive" v-if="worker.Active === 0">inactive</td>
          <td @click.stop>
            <router-link
                :to="{ name: 'addworker', params: { id: worker.Id, worker: worker } }"
                class="worker-btn">
              <i class="fas fa-pencil-alt"></i>
            </router-link>

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
            <multiselect
                v-model="pagination.perPage"
                class="per-page"
                placeholder=""
                :allow-empty="false"
                :searchable="false"
                :options="[30, 50, 80]">
            </multiselect>
          </div>
        </div>
        <pagination
            :current="pagination.currentPage"
            :total="pagination.totalItems"
            :per-page="pagination.perPage"
            @page-changed="PageChanged">
        </pagination>
      </div>

    </div>

  </div>
</template>

<script>
// @ is an alias to /src
import modal from '@/components/modal.vue'
import pagination from '@/components/pagination.vue'
import router from '../router'

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
      activeOptions: [
        {label: 'All', value: ''},
        {label: 'Active', value: '1'},
        {label: 'Inactive', value: '0'},
      ],
      filterBy: {
        Name: '',
        Firm: '',
        Active: {label: 'All', value: ''},
        Date: ''
      },
      pagination: {
        totalItems: 0,
        perPage: 50,
        currentPage: 1
      }
    }
  },
  watch: {
    filterBy: {
      deep: true,
      handler() {
        this.pagination.currentPage = 1
        this.fetchWorkersFilter()
      }
    },
    'pagination.perPage'() {
      this.pagination.currentPage = 1
      this.fetchWorkersFilter()
    }
  },
  mounted() {
    this.fetchWorkersFilter()

    ipcRenderer.on("printWorkersFilter:res", (evt, result) => {
      this.workers = [...result.rows];
      this.pagination.totalItems = parseInt(result.totalItems);
    });

    ipcRenderer.send("printActiveFirms");
    ipcRenderer.on("printActiveFirms:res", (evt, result) => {
      this.firms = [...result]
    });

  },
  computed: {
    paginationMethod() {
      return this.filterBy.Field === 'None' ? (this.filterBy.Active !== '' ? this.activeFilterChanged : this.fetchWorkers) : this.fetchWorkersFilter
    },
    workerIndent() {
      return this.pagination.currentPage * this.pagination.perPage - this.pagination.perPage
    }
  },
  methods: {
    fetchWorkersFilter() {
      let query = {};
      query.pagination = this.pagination
      query.name = this.filterBy.Name
      query.firmId = this.filterBy.Firm ? this.filterBy.Firm.Id : ''
      query.date = this.filterBy.Date
      query.active = this.filterBy.Active.value

      ipcRenderer.send('printWorkersFilter', query)
    },
    deleteWorker(worker) {
      ipcRenderer.sendSync("delete-worker", worker.Id);
      this.workers.splice(this.workers.indexOf(worker), 1);
    },
    PageChanged(page) {
      this.pagination.currentPage = page
      this.fetchWorkersFilter()
    },
    clearFilter() {
      this.filterBy.Name = '';
      this.filterBy.Firm = '';
      this.filterBy.Start = '';
      this.filterBy.End = '';
      this.filterBy.Date.StartDate = '';
      this.filterBy.Date.EndDate = '';
      this.pagination.currentPage = 1;
      this.$v.filterBy.$reset();
      this.workers.splice(0, this.workers.length);
      ipcRenderer.send('printWorkers', this.pagination);
    },
    indexOffset(index) {
      return this.workerIndent + index + 1;
    },
    workerInfo(worker) {
      router.push({name: "workerinfo", params: {id: worker.Id}})
    }

  },
  filters: {
    ageFromBirth(val) {
      if (!val) return ''
      let parts = val.split('.');
      let birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
      let ageDate = new Date(Date.now() - birthDate.getTime());
      return Math.abs(ageDate.getFullYear() - 1970);
    },
    dateFormatter(value) {
      if (value !== 'null') {
        return window.moment(parseFloat(value)).format('DD.MM.YYYY')
      } else {
        return ''
      }
    }
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners();
  },
}
</script>

<style lang="stylus">
  .workers
    .per-page
      width: 60px
    .filter-form
      display: flex

      &>*
        flex: 1
        margin-right: 15px

        &:last-child
          margin-right: 0

      .multiselect,
      .mx-datepicker
        width: 100%
</style>