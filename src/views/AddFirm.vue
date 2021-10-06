<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Firm</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="$v.newFirm.$touch(); if(!$v.newFirm.$invalid){submitFirm()}">
                <div class="input-field col s6 m6">
                    <label>Name</label>
                    <input type="text" class="validate"
                           v-model="newFirm.Name"
                           :class="{ invalid: $v.newFirm.Name.$error, valid: !$v.newFirm.Name.$invalid }">
                    <span v-if="$v.newFirm.Name.$dirty && !$v.newFirm.Name.required" class="danger">This field is required</span>
                </div>
                <div class="input-field col s6 m6">
                    <label>Address</label>
                    <input type="text" class="validate"
                           v-model="newFirm.Address"
                           :class="{ invalid: $v.newFirm.Address.$error, valid: !$v.newFirm.Address.$invalid }">
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
                    <router-link to="/workers" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel</router-link>
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
          Active: {label: 'Active', value: '1'},
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
      if (this.$route.params.firm) this.previousData()
    },
    methods: {
      redirect() {
        router.push('/firms');
      },
      previousData(){
        this.newFirm.Name = this.$route.params.firm.Name;
        this.newFirm.Address = this.$route.params.firm.Address;
        this.newFirm.Active = this.$route.params.firm.Active;
        this.newFirm.Id = this.$route.params.firm.Id;
      },
      submitFirm() {
        if (this.$route.params.firm) this.editFirm()
        else this.addFirm()
      },
      addFirm() {
        ipcRenderer.sendSync('add-firm', this.newFirm) === true ? this.redirect() : console.log("DB Error");
      },
      editFirm() {
        const req = ipcRenderer.sendSync('edit-firm', this.newFirm);
        if(req === true) {
          this.redirect()
        } else {
          this.workers_err = 1;
          setTimeout(() => {
            this.workers_err = false;
          }, 8000);
        }
      }
    }
  }

</script>

<style lang="stylus">
    @import "../styles/variables.styl";
    @import "../styles/firms.styl";
</style>
