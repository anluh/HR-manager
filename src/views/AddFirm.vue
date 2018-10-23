<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Firm</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="$v.newFirm.$touch(); if(!$v.newFirm.$invalid){addFirm()}">
                <div class="input-field col s6 m6">
                    <input id="firm_Name" type="text" class="validate"
                           v-model="newFirm.Name"
                           :class="{ invalid: $v.newFirm.Name.$error, valid: !$v.newFirm.Name.$invalid }">
                    <label for="firm_Name">Name</label>
                    <span v-if="$v.newFirm.Name.$dirty && !$v.newFirm.Name.required" class="danger">This field is required</span>
                </div>
                <div class="input-field col s6 m6">
                    <input id="firm_Address" type="text" class="validate"
                           v-model="newFirm.Address"
                           :class="{ invalid: $v.newFirm.Address.$error, valid: !$v.newFirm.Address.$invalid }">
                    <label for="firm_Address">Address</label>
                    <span v-if="$v.newFirm.Address.$dirty && !$v.newFirm.Address.required" class="danger">This field is required</span>
                </div>
                <div class="input-field input-field--select col s12 m6">
                    <select id="firm_status" v-model="newFirm.Active">
                        <option value="1">Active</option>
                        <option value="0">inActive</option>
                    </select>
                    <label for="firm_status">Status</label>
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
  import { required } from 'vuelidate/lib/validators'

  export default {
    Name: "addfirm",
    data() {
      return {
        newFirm: {
          Name: '',
          Address: '',
          Active: 1,
        },
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
      this.materializeInit();
    },
    methods: {
      redirect() {
        router.push('/firms');
      },
      addFirm() {
        ipcRenderer.sendSync('add-firm', this.newFirm) === true ? this.redirect() : console.log("DB Error");
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
