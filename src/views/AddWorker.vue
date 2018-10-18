<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Worker</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="$v.newWorker.$touch(); if(!$v.newWorker.$invalid){addWorker()}">
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.name"
                           :class="{ invalid: $v.newWorker.name.$error, valid: !$v.newWorker.name.$invalid }"
                           id="worker_name"
                           type="text"
                           class="validate">
                    <label for="worker_name">Name</label>
                    <span v-if="$v.newWorker.name.$dirty && !$v.newWorker.name.required" class="danger">This field is required</span>
                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.age"
                           :class="{ invalid: $v.newWorker.age.$error, valid: !$v.newWorker.age.$invalid }"
                           id="last_name"
                           type="text"
                           class="validate">
                    <label for="last_name">Birthday</label>
                    <span v-if="$v.newWorker.age.$dirty && !$v.newWorker.age.required" class="danger">This field is required</span>
                    <span v-if="$v.newWorker.age.$dirty && !$v.newWorker.age.isDate && $v.newWorker.age.required" class="danger">Enter a valid birthday DD.MM.YYYY</span>

                </div>
                <div class="input-field col s12 m6">
                    <select v-model="newWorker.sex">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                    <label>Sex</label>
                </div>

                <div class="input-field col s12 m6">
                    <select v-model="newWorker.firm">
                        <option :value="firm.Name" v-for="(firm, index) in firms" v-if="firm.Active === 1" :key="index">{{ firm.Name }}</option>
                    </select>
                    <label>Firm</label>
                </div>

                <div class="input-field col s12 m6">
                    <input @change="saveStartDate(newWorker.start)" type="text" class="datepicker" id="worker_start">
                    <label for="worker_start" class="">Start</label>
                </div>
                <div class="input-field col s12 m6">
                    <input @change="saveEndDate()" type="text" class="datepicker"  id="worker_end">
                    <label for="worker_end" class="">End</label>
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
                    <router-link to="/" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
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
          name: '',
          age: '',
          sex: '',
          firm: '',
          start: '',
          startFormated: '',
          end: '',
          endFormated: '',
          Active: 1
        },
        firms: []
      }
    },
    validations:{
      newWorker: {
        name: {
          required
        },
        age: {
          required,
          isDate(value){
            return isDate(value)
          }
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
        // Initialize materialize elements
        (function($){
          $(function(){

            $('select').formSelect();
            $('.datepicker').datepicker({
              format: 'dd.mm.yyyy',
              autoClose: true
            });

          }); // end of document ready
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      },
      saveStartDate(){
        let vm = this;

        /* eslint-disable */
        (function($){
          vm.newWorker.startFormated = $('#worker_start').val();
          let parts = vm.newWorker.startFormated.split('.');

          vm.newWorker.start = new Date(parts[2], parts[1] - 1, parts[0]);

          $('#worker_end').datepicker({
            minDate: vm.newWorker.start,
            format: 'dd.mm.yyyy',
            autoClose: true
          });
        })(jQuery); // end of jQuery name space
        /* eslint-enable */

      },
      saveEndDate(){
        let vm = this;
        /* eslint-disable */
        (function($){
          vm.newWorker.endFormated = $('#worker_start').val();
          let parts = vm.newWorker.endFormated.split('.');
          vm.newWorker.end = new Date(parts[2], parts[1] - 1, parts[0]);
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      }
    }
  }


</script>
