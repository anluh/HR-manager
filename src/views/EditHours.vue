<template>
    <div class="edit-hours">
        <div class="page-title">
            <h3>Edit history</h3>
        </div>
        <div class="view-wrapper">

            <div class="container">
                <form @submit.prevent="$v.newSalary.$touch(); if(!$v.newSalary.$invalid){saveSalary(); $v.newSalary.$reset()}">
                    <div class="input-field add-salary__month">
                        <input id="add-salary__name"
                               :value="newSalary.Worker.Name"
                               class="active"
                               disabled
                               type="text">
                        <label class="active" for="add-salary__name">Name</label>
                    </div>
                    <div class="input-field add-salary__month">
                        <input id="add-salary__month"
                               :value="newSalary.Month | dateFormatter"
                               disabled
                               class="active"
                               type="text">
                        <label class="active" for="add-salary__month">Month</label>
                    </div>

                    <div class="input-field">
                        <input id="add-salary__hours"
                               :class="{ invalid: $v.newSalary.Hours.$error, valid: !$v.newSalary.Hours.$invalid }"
                               v-model="newSalary.Hours">

                        <label class="active" for="add-salary__hours">Hours</label>
                        <span class="error danger" v-show="$v.newSalary.$dirty && !$v.newSalary.Hours.required">This field is required</span>
                        <span class="error danger" v-show="$v.newSalary.$dirty && $v.newSalary.Hours.required && !$v.newSalary.Hours.decimal">Enter valid hours</span>
                    </div>
                    <div class="input-field col s12 m6">
                        <select v-model="newSalary.Firm">
                            <option :value="firmNone.Name">None</option>
                            <option :value="firm.Name" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">{{ firm.Name }}</option>
                        </select>
                        <label>Firm</label>
                    </div>
                    <div class="form-btns">
                        <button class="waves-effect waves-light btn">Save</button>
                        <router-link to="/salary" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
  import router from '../router'
  import autocomplete from "../components/autocomplete"
  const {ipcRenderer} = require('electron');
  import { required, decimal } from 'vuelidate/lib/validators'
  import modal from '@/components/modal.vue'

  export default {
    name: "edithours",
    components: {
      autocomplete,
      modal
    },
    data() {
      return {
        firms: [],
        newSalary: {
          Worker: {
            Name: '',
            Id: null
          },
          Hours: '',
          Firm: 'None',
          Month: ''
        },
        firmNone:{
          Name: 'None',
          Id: null
        },
        selected: null,
      }
    },
    validations: {
      newSalary: {
        Hours: {
          required,
          decimal
        }
      }
    },
    created() {
      let firms = this.firms;
      let workers = this.workers;

      this.newSalary.Id = this.$route.params.history.Id;
      this.newSalary.Worker.Name = this.$route.params.history.Worker_name;
      this.newSalary.Worker.Id = this.$route.params.history.Worker_id;
      this.newSalary.Month = this.$route.params.history.Month;
      this.newSalary.Hours = this.$route.params.history.Hours;
      this.newSalary.Firm = this.$route.params.history.Firm;
      this.newSalary.Report_id = this.$route.params.history.Report_id;

      this.materializeInit();

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        firms.push(result)
      });

      ipcRenderer.on("autocompleteWorkers:res", function (evt, result) {
        workers.push(result);
      });

    },
    methods: {
      redirect(){
        router.push({name: 'workerinfo', params: { id: this.$route.params.history.Worker_id }})
      },
      saveSalary(){
        if(ipcRenderer.sendSync("update-hours", this.newSalary)){
          this.redirect();
        }
      },
      materializeInit(){
        /* eslint-disable */
        (function($){
          $(function(){
            $('select').formSelect();
          });
        })(jQuery);
        /* eslint-enable */
      }
    },
    filters: {
      dateFormatter(value){
        return window.moment(parseInt(value)).format('MM.YYYY')
      }
    }

  }
</script>

<style scoped>

</style>
