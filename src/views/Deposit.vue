<template>
  <div class="deposit">
    <div class="page-title">
      <h3>Deposit</h3>
    </div>

    <div class="salary__wrapper">

      <form class="add-deposit"
            @submit.prevent="$v.newDeposit.$touch(); if(!$v.newDeposit.$invalid){saveDeposit(); $v.newDeposit.$reset();}">
        <div class="input-field">
          <autocomplete :options="workers" ref="workerField" v-model="newDeposit.Worker"></autocomplete>
          <span class="error danger" v-show="$v.newDeposit.$dirty && !$v.newDeposit.Worker.Name.required">This field is required</span>
        </div>
        <div class="input-field">
          <input id="add-deposit__money" v-model="newDeposit.Money" type="text">
          <label for="add-deposit__money">Money</label>
          <span class="error danger" v-show="$v.newDeposit.$dirty && !$v.newDeposit.Money.required">This field is required</span>
          <span class="error danger"
                v-show="$v.newDeposit.$dirty && $v.newDeposit.Money.required && !$v.newDeposit.Money.decimal">Enter valid hours</span>
        </div>
        <div class="input-field">
          <input id="add-deposit__comment" v-model="newDeposit.Comment" type="text">
          <label for="add-deposit__comment">Comment</label>
        </div>

        <button class="waves-effect waves-light btn">Save</button>
      </form>

      <div class="hide-history">
        <a @click.prevent="hideHistory = !hideHistory" href="#">
          <span v-if="!hideHistory"><i class="fas fa-eye-slash"></i>Hide history</span>
          <span v-if="hideHistory"><i class="fas fa-eye"></i>Show history</span>
        </a>
      </div>

      <div :class="{hidden: hideHistory}" class="history-wrapper">
        <table class="striped table-list" cellspacing="0" cellpadding="0">
          <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Money</th>
            <th>Comment</th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="(history, index) in historys" :key="index">
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
                  <div slot="popup-text">Do you want to delete this deposit?</div>
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
      historys: [],
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
  created() {
    let workers = this.workers;
    let historys = this.historys;

    this.fetchAutocompleteWorkersDeposit();
    ipcRenderer.on("autocompleteWorkersDeposit:res", function (evt, result) {
      workers.push(result);
    });

    this.fetchDepositHistory();
    ipcRenderer.on("fetchDepositHistory:res", function (evt, result) {
      historys.push(result);
    });
  },
  methods: {
    saveDeposit() {
      this.newDeposit.Date = moment(new Date(), 'DD.MM.YYYY').valueOf()
      if (ipcRenderer.sendSync("add-deposit", this.newDeposit)) {
        this.fetchDepositHistory();
        this.newDeposit.Money = '';
        this.newDeposit.Comment = '';
        this.$refs.workerField.clear();
        this.$refs.workerField.onFocus();

        /* eslint-disable */
        (jQuery)('.add-deposit__money ~ label').removeClass('active');
        (jQuery)('.add-deposit__comment ~ label').removeClass('active');
        /* eslint-enable */
      }
    },
    fetchAutocompleteWorkersDeposit() {
      this.workers.splice(0, this.workers.length);
      ipcRenderer.send('autocompleteWorkersDeposit');
    },
    fetchDepositHistory() {
      this.historys.splice(0, this.historys.length);
      ipcRenderer.send("fetchDepositHistory")
    },
    deleteHistory(history) {
      if (ipcRenderer.sendSync('delete-deposit', history)) {
        this.fetchDepositHistory();
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

  & > *
    margin: 1rem 10px

</style>
