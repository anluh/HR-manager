<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Worker</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="addWorker()">
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.name" id="worker_name" type="text" class="validate">
                    <label for="worker_name">Name</label>
                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newWorker.age" id="last_name" type="text" class="validate">
                    <label for="last_name">Age</label>
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


                <div class="form-btns">
                    <button class="waves-effect waves-light btn">Save</button>
                    <router-link to="/" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
  const {ipcRenderer} = require('electron');
  import router from '../router'

  export default {
    name: "addworker",
    data (){
      return {
        newWorker: {
          name: '',
          age: null,
          sex: '',
          firm: '',
          start: '',
          startFormated: '',
          end: '',
          endFormated: '',
        },
        firms: []
      }
    },
    created() {
      let firms = this.firms;

      this.materializeInit();

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        firms.push(result)
      });

      ipcRenderer.on('add-worker:res', () => {
        router.push('/');
      })

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
