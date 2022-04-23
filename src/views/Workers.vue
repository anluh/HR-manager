<template>
  <div class="workers">
    <div class="page-title">
      <h3>Workers</h3>
    </div>

    <div class="view-wrapper">
      <router-link
        to="/add/worker"
        class="add-worker-btn btn-floating btn-large waves-effect waves-light"
      >
        <i class="fas fa-plus" style="font-size: 18px"></i>
      </router-link>

      <div class="filter-wrapper">
        <form class="filter-form" @submit.prevent="fetchWorkersFilter()">
          <div class="input-field">
            <label>{{ $t('name') }}</label>
            <input v-model="filterBy.Name" type="text" />
          </div>

          <div class="input-field">
            <label>{{ $t('firm') }}</label>
            <multiselect
              v-model="filterBy.Firm"
              label="Name"
              placeholder=""
              :options="firms"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>

          <div class="input-field">
            <label>{{ $t('start_date') }}</label>
            <date-picker
              type="date"
              :lang="datepickerLang"
              v-model="filterBy.Date"
              :placeholder="$t('datestamp')"
              format="DD.MM.YYYY"
              value-type="timestamp"
              :append-to-body="false"
            />
          </div>
          <div class="input-field">
            <label>{{ $t('active') }}</label>
            <multiselect
              v-model="filterBy.Active"
              label="label"
              placeholder=""
              :searchable="false"
              :allowEmpty="false"
              :options="activeOptions"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>
        </form>
      </div>

      <div class="pagination-section">
        <div
          class="items-per-page"
          v-if="pagination.totalItems > pagination.perPage"
        >
          <span>{{ $t('items_per_page') }}</span>
          <div class="input-field col s12 m6">
            <multiselect
              v-model="pagination.perPage"
              class="per-page"
              placeholder=""
              :allow-empty="false"
              :searchable="false"
              :options="[30, 50, 80]"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>
        </div>
        <pagination
          :current="pagination.currentPage"
          :total="pagination.totalItems"
          :per-page="pagination.perPage"
          @page-changed="PageChanged"
        >
        </pagination>
      </div>

      <table
        class="striped table-list worker-list"
        cellspacing="0"
        cellpadding="0"
      >
        <thead>
          <tr>
            <th>№</th>
            <th>{{ $t('name') }}</th>
            <th>{{ $t('age') }}</th>
            <th>{{ $t('sex') }}</th>
            <th>{{ $t('firm') }}</th>
            <th>{{ $t('hour_rate') }}</th>
            <th>{{ $t('start') }}</th>
            <th>{{ $t('end') }}</th>
            <th>{{ $t('status') }}</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="(worker, index) in workers"
            :key="index"
            @click.stop="workerInfo(worker)"
          >
            <td class="num">{{ indexOffset(index) }}</td>
            <td>{{ worker.Name }}</td>
            <td>{{ worker.Age | ageFromBirth }}</td>
            <td>{{ worker.Sex }}</td>
            <td>{{ worker.Firm }}</td>
            <td>{{ worker.Rate }}</td>
            <td>{{ worker.Start | dateFormatter }}</td>
            <td>{{ worker.End | dateFormatter }}</td>
            <td class="active" v-if="worker.Active === 1">{{ $t('active') }}</td>
            <td class="inactive" v-if="worker.Active === 0">{{ $t('inactive') }}</td>
            <td @click.stop>
              <router-link
                :to="{
                  name: 'addworker',
                  params: { id: worker.Id, worker: worker },
                }"
                class="worker-btn"
              >
                <i class="fas fa-pencil-alt"></i>
              </router-link>

              <modal @submit="deleteWorker(worker)" submit-btn="Delete">
                <i class="danger far fa-trash-alt"></i>
                <div slot="popup-text">{{ $t('delete_worker') }}</div>
              </modal>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="pagination-section">
        <div
          class="items-per-page"
          v-if="pagination.totalItems > pagination.perPage"
        >
          <span>{{ $t('items_per_page') }}</span>
          <div class="input-field col s12 m6">
            <multiselect
              v-model="pagination.perPage"
              class="per-page"
              placeholder=""
              :allow-empty="false"
              :searchable="false"
              :options="[30, 50, 80]"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>
        </div>
        <pagination
          :current="pagination.currentPage"
          :total="pagination.totalItems"
          :per-page="pagination.perPage"
          @page-changed="PageChanged"
        >
        </pagination>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import modal from "@/components/modal.vue";
import pagination from "@/components/pagination.vue";
const electron = require("electron");
const { ipcRenderer } = electron;

export default {
  name: "home",
  components: {
    pagination,
    modal,
  },
  data() {
    return {
      workers: [],
      firms: [],
      activeOptions: [
        { label: this.$t('all'), value: "" },
        { label: this.$t('active'), value: "1" },
        { label: this.$t('inactive'), value: "0" },
      ],
      filterBy: {
        Name: "",
        Firm: "",
        Active: { label:  this.$t('active'), value: "1" },
        Date: "",
      },
      pagination: {
        totalItems: 0,
        perPage: 50,
        currentPage: 1,
      },
    };
  },
  watch: {
    filterBy: {
      deep: true,
      handler() {
        this.pagination.currentPage = 1;
        this.$router.push({ query: this.routerQuery }).catch(()=>{});
        this.fetchWorkersFilter();
      },
    },
    "pagination.perPage"() {
      this.pagination.currentPage = 1;
      this.fetchWorkersFilter();
    },
  },
  mounted() {
    ipcRenderer.send("printActiveFirms");
    ipcRenderer.on("printActiveFirms:res", (evt, result) => {
      this.firms = [...result];

      this.ParseRoute();
      this.fetchWorkersFilter();
    });

    ipcRenderer.on("printWorkersFilter:res", (evt, result) => {
      this.workers = [...result.rows];
      this.pagination.totalItems = parseInt(result.totalItems);
    });
  },
  computed: {
    paginationMethod() {
      return this.filterBy.Field === "None"
        ? this.filterBy.Active !== ""
          ? this.activeFilterChanged
          : this.fetchWorkers
        : this.fetchWorkersFilter;
    },
    workerIndent() {
      return (
        this.pagination.currentPage * this.pagination.perPage -
        this.pagination.perPage
      );
    },
    routerQuery() {
      let query = {
        active: this.filterBy.Active.value,
      };
      if (this.filterBy.Date) query["date"] = this.filterBy.Date;
      if (this.filterBy.Firm) query["firm_id"] = this.filterBy.Firm.Id;
      if (this.filterBy.Name) query["name"] = this.filterBy.Name;

      return query;
    },
  },
  methods: {
    ParseRoute() {
      const route = this.$route.query;
      if (route.hasOwnProperty('active')) {
        if (route.active) {
          this.filterBy.Active = this.activeOptions.find(
            (i) => i.value === route.active
          );
        } else this.filterBy.Active = this.activeOptions[0];
      }

      if (route.firm_id) {
        this.filterBy.Firm = this.firms.find(
          (i) => i.Id === parseInt(route.firm_id)
        );
      }

      if (route.name) this.filterBy.Name = route.name;
      if (route.date) this.filterBy.Date = parseInt(route.date);
    },
    fetchWorkersFilter() {
      let query = {};
      query.pagination = this.pagination;
      query.name = this.filterBy.Name;
      query.firmId = this.filterBy.Firm ? this.filterBy.Firm.Id : "";
      query.date = this.filterBy.Date;
      query.active = this.filterBy.Active.value;

      ipcRenderer.send("printWorkersFilter", query);
    },
    deleteWorker(worker) {
      ipcRenderer.sendSync("delete-worker", worker.Id);
      this.workers.splice(this.workers.indexOf(worker), 1);
    },
    PageChanged(page) {
      this.pagination.currentPage = page;
      this.fetchWorkersFilter();
    },
    clearFilter() {
      this.filterBy.Name = "";
      this.filterBy.Firm = "";
      this.filterBy.Start = "";
      this.filterBy.End = "";
      this.filterBy.Date.StartDate = "";
      this.filterBy.Date.EndDate = "";
      this.pagination.currentPage = 1;
      this.$v.filterBy.$reset();
      this.workers.splice(0, this.workers.length);
      ipcRenderer.send("printWorkers", this.pagination);
    },
    indexOffset(index) {
      return this.workerIndent + index + 1;
    },
    workerInfo(worker) {
      this.$router.push({ name: "workerinfo", params: { id: worker.Id } });
    },
  },
  filters: {
    ageFromBirth(val) {
      if (!val) return "";
      let parts = val.split(".");
      let birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
      let ageDate = new Date(Date.now() - birthDate.getTime());
      return Math.abs(ageDate.getFullYear() - 1970);
    },
    dateFormatter(value) {
      if (value !== "null") {
        return window.moment(parseFloat(value)).format("DD.MM.YYYY");
      } else {
        return "";
      }
    },
  },
  beforeDestroy() {
    ipcRenderer.removeAllListeners();
  },
};
</script>

<style lang="stylus">
.workers {
  .per-page {
    width: 60px;
  }

  .filter-form {
    display: flex;

    &>* {
      flex: 1;
      margin-right: 15px;

      &:last-child {
        margin-right: 0;
      }
    }

    .multiselect, .mx-datepicker {
      width: 100%;
    }
  }
}
</style>