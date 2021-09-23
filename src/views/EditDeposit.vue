<template>
    <div class="deposit">
        <div class="page-title">
            <h3>Edit Deposit {{newDeposit.Worker_name}}</h3>
        </div>

        <div class="salary__wrapper container">

            <form class="add-deposit" @submit.prevent="$v.newDeposit.$touch(); if(!$v.newDeposit.$invalid){saveDeposit(); $v.newDeposit.$reset();}">
                <div class="input-field">
                    <input id="add-deposit__name"
                           :value="newDeposit.Worker_name"
                           disabled
                           type="text">
                    <label class="active" for="add-deposit__name">Name</label>
                </div>
                <div class="input-field">
                    <input id="add-deposit__date"
                           :value="date"
                           disabled
                           type="text">
                    <label class="active" for="add-deposit__date">Date</label>
                </div>
                <div class="input-field">
                    <input id="add-deposit__hours" v-model="newDeposit.Money" type="text">
                    <label class="active" for="add-deposit__hours">Money</label>
                    <span class="error danger" v-show="$v.newDeposit.$dirty && !$v.newDeposit.Money.required">This field is required</span>
                    <span class="error danger" v-show="$v.newDeposit.$dirty && $v.newDeposit.Money.required && !$v.newDeposit.Money.decimal">Enter valid hours</span>
                </div>

                <div class="input-field">
                    <input id="add-deposit__comment" v-model="newDeposit.Comment" type="text">
                    <label class="active" for="add-deposit__comment">Comment</label>
                </div>

                <button class="waves-effect waves-light btn">Save</button>
                <router-link to="/deposit" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
            </form>

        </div>

    </div>
</template>

<script>
  import router from "../router"
  import moment from 'moment';
  const {ipcRenderer} = require('electron');
  import { required, decimal } from 'vuelidate/lib/validators'

  export default {
    name: "editdeposit",
    data() {
      return {
        date: '',
        newDeposit: {},
        selected: null
      }
    },
    validations: {
      newDeposit: {
        Money: {
          required,
          decimal
        }
      }
    },
    created() {
      let v = this;

      ipcRenderer.send("fetchCurrentDeposit", this.$route.params.deposit.Id);

      ipcRenderer.on("fetchCurrentDeposit:res", function (evt, result) {
        v.newDeposit = result;
        v.newDeposit.oldMoney = result.Money;
      });

      this.date = moment(this.newDeposit.Date).format('DD.MM.YYYY');

    },
    methods: {
      saveDeposit(){
        if(ipcRenderer.sendSync("update-deposit", this.newDeposit)){
          router.push({name: 'workerinfo', params: { id: this.newDeposit.Worker_id }})
        }
      },
    },
  }
</script>

<style lang="stylus" scoped>
    @import "../styles/salary.styl"

</style>
