<template>
  <div class="add-worker relative">
    <div class="page-title">
      <h3 v-if="editPage">{{ $t('edit') }} {{ $t('worker') }}: {{ this.$route.params.worker.Name }}</h3>
      <h3 v-else >{{ $t('add') }} {{ $t('worker') }}</h3>
    </div>

    <div class="page-wrapper">
      <transition name="slide-fade">
        <div v-if="workers_err" class="toast toast--error">
          {{ $t('worker') }} {{ newWorker.Name }} {{ $t('already_exis') }}.
        </div>
      </transition>

      <div class="container">
        <form
          v-on:submit.prevent="
            $v.newWorker.$touch();
            if (!$v.newWorker.$invalid) {
              addWorker();
            }
          "
        >
          <div class="input-field col s6 m6">
            <label>{{ $t('name') }}</label>
            <input
              v-model="newWorker.Name"
              :class="{
                invalid: $v.newWorker.Name.$error,
                valid: !$v.newWorker.Name.$invalid,
              }"
              id="worker_name"
              type="text"
              class="validate"
            />
            <span
              v-if="$v.newWorker.Name.$dirty && !$v.newWorker.Name.required"
              class="danger"
              >{{ $t('required') }}</span
            >
          </div>

          <div class="input-field col s6 m6">
            <label>{{ $t('birthday') }}</label>
            <date-picker
              class="full-width"
              type="date"
              :lang="datepickerLang"
              v-model="newWorker.Age"
              :placeholder="$t('datestamp')"
              format="DD.MM.YYYY"
              value-type="DD.MM.YYYY"
              :append-to-body="false"
            />
          </div>

          <div class="input-field col s12 m6">
            <label>{{ $t('sex') }}</label>
            <multiselect
              class="full-width"
              v-model="newWorker.Sex"
              :placeholder="$t('sex')"
              :options="['Male', 'Femail']"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>

          <div class="input-field col s12 m6">
            <label>{{ $t('firm') }}</label>
            <multiselect
              class="full-width"
              v-model="newWorker.Firm"
              label="Name"
              :placeholder="$t('firm')"
              :options="firms"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>

          <div class="input-field col s6 m6">
            <label>{{ $t('start') }}</label>
            <date-picker
              class="full-width"
              type="month"
              :lang="datepickerLang"
              v-model="newWorker.startDate"
              :placeholder="$t('monthstamp')"
              format="MM.YYYY"
              value-type="MM.YYYY"
              :append-to-body="false"
            />
            <span
              v-if="
                $v.newWorker.startDate.$dirty &&
                !$v.newWorker.startDate.required
              "
              class="danger"
              >{{ $t('required') }}</span
            >
            <span
              v-if="
                $v.newWorker.startDate.$dirty &&
                !$v.newWorker.startDate.isDate &&
                $v.newWorker.startDate.required
              "
              class="danger"
              >{{ $t('valid_date') }}</span
            >
          </div>

          <div class="input-field col s6 m6">
            <label>{{ $t('end') }}</label>
            <date-picker
              class="full-width"
              type="month"
              :lang="datepickerLang"
              v-model="newWorker.endDate"
              :placeholder="$t('monthstamp')"
              format="MM.YYYY"
              value-type="MM.YYYY"
              :append-to-body="false"
            />
            <span
              v-if="
                $v.newWorker.endDate.$dirty && !$v.newWorker.endDate.minDate
              "
              class="danger"
              >{{ $t('end_valid') }}</span
            >
          </div>

          <div class="input-field col s12 m6">
            <label>{{ $t('status') }}</label>
            <multiselect
              class="full-width"
              v-model="newWorker.Active"
              :placeholder="$t('status')"
              label="label"
              :options="[
                { label: $t('active'), value: 1 },
                { label:  $t('inactive'), value: 0 },
              ]"
            >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
            </multiselect>
          </div>

          <div class="input-field col s6 m6">
            <label>{{ $t('hour_rate') }}</label>
            <input
              v-model="newWorker.Rate"
              id="worker_rate"
              type="text"
              :class="{
                invalid: $v.newWorker.Rate.$error,
                valid: !$v.newWorker.Rate.$invalid,
              }"
            />
            <span
              v-if="
                $v.newWorker.Rate.$dirty && !$v.newWorker.Rate.numeric
              "
              class="danger"
              >{{ $t('number_valid') }}</span
            >
          </div>

          <div class="form-btns">
            <button class="waves-effect waves-light btn">{{ $t('save') }}</button>
            <router-link
              to="/workers"
              class="waves-effect waves-light btn red"
              style="margin-left: 20px"
              >{{ $t('cancel') }}</router-link
            >
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";
import router from "../router";
const { ipcRenderer } = require("electron");
import { required, numeric } from "vuelidate/lib/validators";

const isDate = (value) => moment(value, "MM.YYYY", true).isValid();

export default {
  name: "addworker",
  data() {
    return {
      newWorker: {
        Name: "",
        Age: "",
        Sex: "Male",
        Firm: {
          Name: "None",
          Id: null,
        },
        Start: null,
        startDate: "",
        End: null,
        endDate: "",
        Rate: "",
        Active: { label: this.$t('active'), value: 1 },
      },
      firms: [],
      firmNone: {
        Name: "None",
        Id: null,
      },
      workers_err: false,
    };
  },
  validations: {
    newWorker: {
      Name: {
        required,
      },
      startDate: {
        required,
        isDate(value) {
          return isDate(value);
        },
      },
      Rate: {
        numeric
      },
      endDate: {
        minDate() {
          if (this.newWorker.Start && this.newWorker.End) {
            return this.newWorker.Start < this.newWorker.End;
          } else {
            return true;
          }
        },
      },
    },
  },
  watch: {
    "newWorker.startDate"(value) {
      this.newWorker.Start = window.moment(value, "MM.YYYY").valueOf();
    },
    "newWorker.Name"() {
      this.workers_err = 0
    },
    "newWorker.endDate"(value) {
      if (value) {
        this.newWorker.End = window.moment(value, "MM.YYYY").valueOf();
      } else {
        this.newWorker.End = null;
      }
    },
  },
  mounted() {
    if (this.$route.params.worker) {
      this.previousData();
    }

    ipcRenderer.send("printActiveFirms");
    ipcRenderer.on("printActiveFirms:res", (evt, result) => {
      this.firms = [...result];
    });
  },
  computed: {
    editPage() {
      return Boolean(this.$route.params.worker);
    },
  },
  methods: {
    redirect() {
      router.push("/workers");
    },
    addWorker() {
      let query = JSON.parse(JSON.stringify(this.newWorker));
      if (!query.Rate) query.Rate = 0
      query.Active = this.newWorker.Active.value

      if (this.$route.params.worker) {
        if (ipcRenderer.sendSync("edit-worker", query)) this.redirect();
      } else {
        if (ipcRenderer.sendSync("add-worker", query)) {
          this.redirect();
        } else {
          this.workers_err = true;
          setTimeout(() => {
            this.workers_err = false;
          }, 8000);
        }
      }
    },
    previousData() {
      this.newWorker.Id = this.$route.params.worker.Id;
      this.newWorker.Name = this.$route.params.worker.Name;
      this.newWorker.Age = this.$route.params.worker.Age;
      this.newWorker.Sex = this.$route.params.worker.Sex;
      this.newWorker.Rate = this.$route.params.worker.Rate;
      this.newWorker.Firm.Name = this.$route.params.worker.Firm;
      this.newWorker.Firm.Id = this.$route.params.worker.Firm_id;
      this.newWorker.Active = this.$route.params.worker.Active
        ? { label: this.$t('active'), value: 1 }
        : { label: this.$t('inactive'), value: 0 };
      this.newWorker.startDate = window
        .moment(parseFloat(this.$route.params.worker.Start))
        .format("MM.YYYY");
      if (this.$route.params.worker.End !== "null") {
        this.newWorker.endDate = window
          .moment(parseFloat(this.$route.params.worker.End))
          .format("MM.YYYY");
      } else {
        this.newWorker.endDate = "";
      }
    },
  },
};
</script>
