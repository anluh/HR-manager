<template>
    <div class="edit-firm">
        <div class="page-title">
            <h3>Edit Firm</h3>
        </div>
        <div class="view-wrapper">
            <transition name="slide-fade">
                <div v-if="workers_err" class="toast toast--error">There are workers on this firm, please unassign them in "Workers" page and try again.</div>
            </transition>

            <div class="container">
                <form v-on:submit.prevent="$v.newFirm.$touch(); if(!$v.newFirm.$invalid){editFirm()}">
                    <div class="input-field col s6 m6">
                        <input id="firm_Name" type="text" class="validate"
                               v-model="newFirm.Name"
                               :class="{ invalid: $v.newFirm.Name.$error, valid: !$v.newFirm.Name.$invalid }">
                        <label for="firm_Name" class="active">Name</label>
                        <span v-if="$v.newFirm.Name.$dirty && !$v.newFirm.Name.required" class="danger">This field is required</span>
                    </div>
                    <div class="input-field col s6 m6">
                        <input id="firm_Address" type="text" class="validate"
                               v-model="newFirm.Address"
                               :class="{ invalid: $v.newFirm.Address.$error, valid: !$v.newFirm.Address.$invalid }">
                        <label for="firm_Address" class="active">Address</label>
                        <span v-if="$v.newFirm.Address.$dirty && !$v.newFirm.Address.required" class="danger">This field is required</span>
                    </div>
                    <div class="input-field input-field--select col s12 m6">
                      <label>Active</label>
                      <multiselect
                          v-model="newFirm.Active"
                          label="label"
                          placeholder=""
                          :searchable="false"
                          :options="activeOptions">
                      </multiselect>
                    </div>

                    <div class="form-btns">
                        <button class="waves-effect waves-light btn">Save</button>
                        <router-link to="/firms" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
  const {ipcRenderer} = require('electron');
  import router from '../router'
  import { required } from 'vuelidate/lib/validators'

  export default {
    Name: "editfirm",
    data() {
      return {
        newFirm: {
          Name: '',
          Address: '',
          Active: {label: 'Active', value: '1'},
          Id: null
        },
        activeOptions: [
          {label: 'Active', value: '1'},
          {label: 'Inactive', value: '0'},
        ],
        workers_err: 0
      }
    },
    validations: {
      newFirm: {
        Name: {
          required
        },
        Address: {
          required
        }
      }
    },
    created() {
      this.previousData();
      this.materializeInit();
    },
    methods: {
      redirect() {
        router.push('/firms');
      },
      editFirm() {
        let req = ipcRenderer.sendSync('edit-firm', this.newFirm);
        let vm = this;

        if(req === true) {
          this.redirect()
        } else {
          this.workers_err = 1;
          setTimeout(function(){
            vm.workers_err = false;
          }, 8000);
        }
      },
      previousData(){
        this.newFirm.Name = this.$route.params.firm.Name;
        this.newFirm.Address = this.$route.params.firm.Address;
        this.newFirm.Active = this.$route.params.firm.Active;
        this.newFirm.Id = this.$route.params.firm.Id;
      },
      materializeInit(){
        /* eslint-disable */
        // Initialize materialize elements
        (function($){
          $(function(){

            $('select').formSelect();

          }); // end of document ready
        })(jQuery); // end of jQuery Name space
        /* eslint-enable */
      }
    }
  }

</script>

<style lang="stylus">
    @import "../styles/variables.styl";
    @import "../styles/firms.styl";
</style>
