<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Worker</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="$v.newWorker.$touch(); if(!$v.newWorker.$invalid){addWorker()}">
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.Name"
                           :class="{ invalid: $v.newWorker.Name.$error, valid: !$v.newWorker.Name.$invalid }"
                           id="worker_name"
                           type="text"
                           class="validate">
                    <label for="worker_name">Name</label>
                    <span v-if="$v.newWorker.Name.$dirty && !$v.newWorker.Name.required" class="danger">This field is required</span>
                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.Age"
                           :class="{ invalid: $v.newWorker.Age.$error, valid: !$v.newWorker.Age.$invalid }"
                           id="last_name"
                           type="text"
                           class="validate">
                    <label for="last_name">Birthday</label>
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
                        <option :value="firm" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">{{ firm.Name }}</option>
                    </select>
                    <label>Firm</label>
                </div>

                <div class="input-field col s6 m6">
                    <input v-model.lazy="newWorker.startDate"
                           :class="{ invalid: $v.newWorker.startDate.$error, valid: !$v.newWorker.startDate.$invalid }"
                           id="worker_start"
                           type="text"
                           class="validate">
                    <label for="worker_start">Start</label>
                    <span v-if="$v.newWorker.startDate.$dirty && !$v.newWorker.startDate.required" class="danger">This field is required</span>
                    <span v-if="$v.newWorker.startDate.$dirty && !$v.newWorker.startDate.isDate && $v.newWorker.startDate.required" class="danger">Enter a valid date DD.MM.YYYY</span>

                </div>
                <div class="input-field col s6 m6">
                    <input v-model.lazy="newWorker.endDate"
                           :class="{ invalid: $v.newWorker.endDate.$error }"
                           id="worker_end"
                           class="validate"
                           type="text">
                    <label for="worker_end">End</label>
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
    name: "addworker",
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
          Start: null,
          startDate: '',
          End: null,
          endDate: '',
          Active: 1
        },
        firms: [],
        firmNone:{
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
        this.newWorker.Start = window.moment(value, "DD.MM.YYYY").valueOf();
      },
      'newWorker.endDate'(value){
        if(value) {
          this.newWorker.End = window.moment(value, "DD.MM.YYYY").valueOf();
        } else {
          this.newWorker.End = null;
        }
      }
    },
    created() {
      let firms = this.firms;

      this.materializeInit();

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        firms.push(result)
      });

    },
    methods:{
      redirect(){
        router.push('/');
      },
      addWorker () {
        ipcRenderer.sendSync('add-worker', this.newWorker) === true ? this.redirect() : console.log("DB Error");
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
