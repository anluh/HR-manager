<template>
    <div class="edit-hours">
        <div class="page-title">
            <h3>{{ $t('edit') }} {{ $t('hours') }}</h3>
        </div>
        <div class="view-wrapper">

            <div class="container">
                <form @submit.prevent="$v.newSalary.$touch(); if(!$v.newSalary.$invalid){saveSalary(); $v.newSalary.$reset()}">
                    <div class="input-field">
                        <label>{{ $t('name') }}</label>
                        <input :value="newSalary.Worker.Name"
                               class="full-width"
                               disabled
                               type="text" />
                    </div>
                    <div class="input-field">
                        <label>{{ $t('month') }}</label>
                        <input :value="newSalary.Month | dateFormatter"
                               disabled
                               class="full-width"
                               type="text" />
                    </div>

                    <div class="input-field">
                        <label>{{ $t('hours') }}</label>
                        <input :class="{ invalid: $v.newSalary.Hours.$error }"
                               v-model="newSalary.Hours"
                               type="text">
                        <span class="error danger" v-show="$v.newSalary.$dirty && !$v.newSalary.Hours.required">This field is required</span>
                        <span class="error danger" v-show="$v.newSalary.$dirty && $v.newSalary.Hours.required && !$v.newSalary.Hours.decimal">Enter valid hours</span>
                    </div>
                    <div class="input-field col s12 m6">
                        <label>{{ $t('firm') }}</label>
                        <multiselect
                            class="full-width"
                            v-model="newSalary.Firm"
                            label="Name"
                            placeholder=""
                            :options="firms" >
                              <span slot="noOptions">{{ $t('empty_list') }}</span>
                        </multiselect>
                    </div>
                    <div class="form-btns">
                        <button class="waves-effect waves-light btn">{{ $t('save') }}</button>
                        <router-link to="/salary" class="waves-effect waves-light btn red" style="margin-left: 20px">{{ $t('cancel') }}</router-link>
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
    mounted() {
      this.newSalary.Id = this.$route.params.history.Id;
      this.newSalary.Worker.Name = this.$route.params.history.Worker_name;
      this.newSalary.Worker.Id = this.$route.params.history.Worker_id;
      this.newSalary.Month = this.$route.params.history.Month;
      this.newSalary.Hours = this.$route.params.history.Hours;
      this.newSalary.Firm = this.$route.params.history.Firm;
      this.newSalary.Report_id = this.$route.params.history.Report_id;

      ipcRenderer.send("printActiveFirms");
      ipcRenderer.on("printActiveFirms:res", (evt, result) => {
        this.firms = [...result]
        this.newSalary.Firm = this.firms.find(i => i.Name === this.$route.params.history.Firm)
      });

      ipcRenderer.on("autocompleteWorkers:res", (evt, result) => {
        this.workers = [...result]
      });

    },
    methods: {
      redirect(){
        router.push({name: 'workerinfo', params: { id: this.$route.params.history.Worker_id }})
      },
      saveSalary(){
        let query = this.newSalary
        query.Firm = this.newSalary.Firm.Name
        if(ipcRenderer.sendSync("update-hours", this.newSalary)){
          this.redirect();
        }
      },
    },
    filters: {
      dateFormatter(value){
        return window.moment(parseFloat(value)).format('MM.YYYY')
      }
    }

  }
</script>

<style>

</style>
