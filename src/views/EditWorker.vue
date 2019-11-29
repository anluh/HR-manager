<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Worker</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="$v.newWorker.$touch(); if(!$v.newWorker.$invalid){editWorker()}">
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.Name"
                           :class="{ invalid: $v.newWorker.Name.$error, valid: !$v.newWorker.Name.$invalid }"
                           id="worker_name"
                           type="text"
                           class="validate">
                    <label for="worker_name" class="active">Name</label>
                    <span v-if="$v.newWorker.Name.$dirty && !$v.newWorker.Name.required" class="danger">This field is required</span>
                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.Age"
                           :class="{ invalid: $v.newWorker.Age.$error, valid: !$v.newWorker.Age.$invalid }"
                           id="last_name"
                           type="text"
                           class="validate">
                    <label for="last_name" class="active">Birthday</label>
                    <span v-if="$v.newWorker.Age.$dirty && !$v.newWorker.Age.required" class="danger">This field is required</span>
                    <span v-if="$v.newWorker.Age.$dirty && !$v.newWorker.Age.isDate && $v.newWorker.Age.required" class="danger">Enter a valid birthday DD.MM.YYYY</span>

                </div>
                <div class="input-field col s12 m6">
                    <select v-model="newWorker.Sex">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <label>Sex</label>
                </div>

                <div class="input-field col s12 m6">
                    <select v-model="newWorker.Firm">
                        <option :value="firmNone">None</option>
                        <option :value="firm" v-for="(firm, index) in firms" :key="index">{{ firm.Name }}</option>
                    </select>
                    <label>Firm</label>
                </div>

                <div class="input-field col s6 m6">
                    <input v-model="newWorker.startDate"
                           :class="{ invalid: $v.newWorker.startDate.$error, valid: !$v.newWorker.startDate.$invalid }"
                           id="worker_start"
                           type="text"
                           class="validate">
                    <label for="worker_start" class="active">Start</label>
                    <span v-if="$v.newWorker.startDate.$dirty && !$v.newWorker.startDate.required" class="danger">This field is required</span>
                    <span v-if="$v.newWorker.startDate.$dirty && !$v.newWorker.startDate.isDate && $v.newWorker.startDate.required" class="danger">Enter a valid date DD.MM.YYYY</span>

                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.endDate"
                           :class="{ invalid: $v.newWorker.endDate.$error }"
                           id="worker_end"
                           type="text"
                           class="validate">
                    <label for="worker_end" class="active">End</label>
                    <span v-if="$v.newWorker.endDate.$dirty && !$v.newWorker.endDate.isDate" class="danger">Enter a valid date DD.MM.YYYY</span>
                    <span v-if="$v.newWorker.endDate.$dirty && $v.newWorker.endDate.isDate && $v.newWorker.startDate.required && !$v.newWorker.endDate.minDate" class="danger">Enter a valid end date</span>

                </div>
                <div class="input-field col s12 m6">
                    <select v-model="newWorker.Active">
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                    <label>Status</label>
                </div>


                <div class="form-btns">
                    <button class="waves-effect waves-light btn">Save</button>
                    <router-link to="/workers" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
  import moment from 'moment';
  import router from '../router'
  const {ipcRenderer} = require('electron');
  import { required } from 'vuelidate/lib/validators'

  const isDate = (value) => moment(value, 'DD.MM.YYYY', true).isValid()

  export default {
    name: "editworker",
    data (){
      return {
        newWorker: {
          Name: '',
          Age: '',
          Sex: 'Male',
          Firm: {
            Name: 'None',
            Id: null,
          },
          Start: 0,
          startDate: '',
          End: 0,
          endDate: '',
          Active: 1
        },
        firms: [],
        firmNone: {
          Name: 'None',
          Id: null
        }
      }
    },
    validations:{
      newWorker: {
        Name: {
          required
        },
        Age: {
          required,
          isDate(value){
            return isDate(value)
          }
        },
        startDate: {
          required,
          isDate(value){
            return isDate(value)
          }
        },
        endDate: {
          minDate(){
            if(this.newWorker.Start && this.newWorker.End){
              return this.newWorker.Start < this.newWorker.End
            } else {
              return true
            }
          },
          isDate(value){
            if(value ===''){
              return true
            } else {
              return isDate(value)
            }
          }
        }
      }
    },
    watch: {
      'newWorker.startDate'(value){
        this.newWorker.Start = window.moment(value, 'DD.MM.YYYY').valueOf();
      },
      'newWorker.endDate'(value){
        if(value) {
          this.newWorker.End = window.moment(value, 'DD.MM.YYYY').valueOf();
        } else {
          this.newWorker.End = null
        }
      }
    },
    created() {
      let firms = this.firms;

      this.materializeInit();
      this.previousData();

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        if(result.Active === 1){
          let query = {
            Name: result.Name,
            Id: result.Id
          };
        firms.push(query)
        }
      });

    },
    methods:{
      redirect(){
        router.push('/');
      },
      editWorker () {
        ipcRenderer.sendSync('edit-worker', this.newWorker) === true ? this.redirect() : console.log("DB Error");
      },
      previousData(){
        this.newWorker.Id = this.$route.params.worker.Id;
        this.newWorker.Name = this.$route.params.worker.Name;
        this.newWorker.Age = this.$route.params.worker.Age;
        this.newWorker.Sex = this.$route.params.worker.Sex;
        this.newWorker.Firm.Name = this.$route.params.worker.Firm;
        this.newWorker.Firm.Id = this.$route.params.worker.Firm_id;
        this.newWorker.Active = this.$route.params.worker.Active;
        this.newWorker.startDate =  window.moment(parseFloat(this.$route.params.worker.Start)).format('DD.MM.YYYY');
        if(this.$route.params.worker.End !== 'null') {
          this.newWorker.endDate = window.moment(parseFloat(this.$route.params.worker.End)).format('DD.MM.YYYY');
        } else {
          this.newWorker.endDate = ''
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
    }
  }


</script>
