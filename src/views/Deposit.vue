<template>
  <div class="deposit">
    <div class="page-title">
      <h3>{{ $t('deposit') }}</h3>
    </div>

    <div class="salary__wrapper">

      <form class="add-deposit"
            @submit.prevent="$v.newDeposit.$touch(); if(!$v.newDeposit.$invalid){saveDeposit(); $v.newDeposit.$reset();}">
        <div class="input-field">
          <label>{{ $t('worker') }}</label>
          <multiselect
            v-model="newDeposit.Worker"
            ref="workerField"
            label="Name"
            placeholder="Worker"
            :options="workers" >
              <span slot="noOptions">{{ $t('empty_list') }}</span>
          </multiselect>
          <span class="error danger" v-show="$v.newDeposit.$dirty && !$v.newDeposit.Worker.Name.required">{{ $t('required') }}</span>
        </div>
        <div class="input-field">
          <label>{{ $t('money') }}</label>
          <input id="add-deposit__money" v-model="newDeposit.Money" type="text">
          <span class="error danger" v-show="$v.newDeposit.$dirty && !$v.newDeposit.Money.required">{{ $t('required') }}</span>
          <span class="error danger"
                v-show="$v.newDeposit.$dirty && $v.newDeposit.Money.required && !$v.newDeposit.Money.decimal">{{ $t('number_valid') }}</span>
        </div>
        <div class="input-field">
          <label>{{ $t('comment') }}</label>
          <input id="add-deposit__comment" v-model="newDeposit.Comment" type="text">
        </div>

        <button class="waves-effect waves-light btn save">{{ $t('save') }}</button>
      </form>

      <div class="hide-history">
        <a @click.prevent="hideHistory = !hideHistory" href="#">
          <span v-if="!hideHistory"><i class="fas fa-eye-slash"></i>{{ $t('hide_history') }}</span>
          <span v-if="hideHistory"><i class="fas fa-eye"></i>{{ $t('show_history') }}</span>
        </a>
      </div>

      <div :class="{hidden: hideHistory}" class="history-wrapper">
        <table class="striped table-list" cellspacing="0" cellpadding="0">
          <thead>
          <tr>
            <th></th>
            <th>{{ $t('name') }}</th>
            <th>{{ $t('date') }}</th>
            <th>{{ $t('money') }}</th>
            <th>{{ $t('comment') }}</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(history, index) in histories" :key="index">
            <td class="table-index">{{ index + 1 }}</td>
            <td>{{ history.Worker_name }}</td>
            <td>{{ history.Date | dateFormatter }}</td>
            <td>{{ history.Money }}</td>
            <td>{{ history.Comment }}</td>
            <td>
              <div v-show="depositsCheckSalary(history)">
                <router-link @click.stop :to="{ name: 'editdeposit', params: { id: history.Id, deposit: history } }"
                             class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                <modal @submit="deleteHistory(history)" submit-btn="Delete">
                  <i v-if="!history.Report_id" class="danger far fa-trash-alt"></i>
                  <div slot="popup-text">{{ $t('delete_deposit') }}</div>
                </modal>
              </div>
            </td>
          </tr>
          </tbody>
        </table>
      </div>

    </div>

  </div>
</template>

<script>
const {ipcRenderer} = require('electron');
import {required, decimal} from 'vuelidate/lib/validators'
import modal from '@/components/modal.vue'
import autocomplete from "../components/autocomplete"
import moment from 'moment';

export default {
  name: "deposit",
  components: {
    autocomplete,
    modal
  },
  data() {
    return {
      workers: [],
      histories: [],
      hideHistory: false,
      newDeposit: {
        Worker: {
          Id: null,
          Name: ''
        },
      },
      selected: null
    }
  },
  validations: {
    newDeposit: {
      Worker: {
        Name: {
          required
        }
      },
      Money: {
        required,
        decimal
      }
    }
  },
  watch: {
    'newDeposit.Worker'() {
      this.fetchDepositHistory()
    }
  },
  mounted() {
    this.fetchAutocompleteWorkersDeposit();
    ipcRenderer.on("autocompleteWorkersDeposit:res", (evt, result) => {
      this.workers = [...result]
    });

    this.fetchDepositHistory();
    ipcRenderer.on("fetchDepositHistory:res", (evt, result) => {
      this.histories = [...result];
    });
  },
  methods: {
    saveDeposit() {
      this.newDeposit.Date = moment(new Date(), 'DD.MM.YYYY').valueOf()
      if (ipcRenderer.sendSync("add-deposit", this.newDeposit)) {
        this.fetchDepositHistory();
        this.newDeposit.Money = '';
        this.newDeposit.Comment = '';
        this.$refs.workerField.$el.focus();

        /* eslint-disable */
        (jQuery)('.add-deposit__money ~ label').removeClass('active');
        (jQuery)('.add-deposit__comment ~ label').removeClass('active');
        /* eslint-enable */
      }
    },
    fetchAutocompleteWorkersDeposit() {
      this.workers= []
      ipcRenderer.send('autocompleteWorkersDeposit')
    },
    fetchDepositHistory() {
      this.histories = []
      const worker = this.newDeposit.Worker ? this.newDeposit.Worker.Name : ''
      ipcRenderer.send("fetchDepositHistory", worker)
    },
    deleteHistory(history) {
      if (ipcRenderer.sendSync('delete-deposit', history)) {
        this.fetchDepositHistory()
      }
    },
    depositsCheckSalary(deposit) {
      if (!deposit.Report_id) {
        return 1
      } else {
        return ipcRenderer.sendSync('deposit-check-salary', deposit)
      }
    }
  },
  filters: {
    dateFormatter(value) {
      return window.moment(parseFloat(value)).format('DD.MM.YYYY')
    }
  }
}
</script>

<style lang="stylus" scoped>
@import "../styles/salary.styl"

.add-deposit
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 80px

  .input-field
    flex 1
    margin-right 15px

    .multiselect
      width 100%

</style>
