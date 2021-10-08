<template>
  <div class="add-worker relative">
    <div class="page-title">
      <h3 v-if="editPage">Edit Firm</h3>
      <h3 v-else>Add Firm</h3>
    </div>

    .
    <div class="page-wrapper">
      <transition name="slide-fade">
        <div v-if="workers_err" class="toast toast--error">There are workers on this firm, please un-assign them in "Workers" page and try again.</div>
      </transition>

      <div class="container">
        <form v-on:submit.prevent="$v.newFirm.$touch(); if(!$v.newFirm.$invalid){submitFirm()}">
          <div class="input-field col s6 m6">
            <label>Name</label>
            <input type="text" class="validate"
                   v-model="newFirm.Name"
                   :class="{ invalid: $v.newFirm.Name.$error, valid: !$v.newFirm.Name.$invalid }">
            <span v-if="$v.newFirm.Name.$dirty && !$v.newFirm.Name.required"
                  class="danger">This field is required</span>
          </div>
          <div class="input-field col s6 m6">
            <label>Address</label>
            <input type="text" class="validate"
                   v-model="newFirm.Address"
                   :class="{ invalid: $v.newFirm.Address.$error, valid: !$v.newFirm.Address.$invalid }">
            <span v-if="$v.newFirm.Address.$dirty && !$v.newFirm.Address.required"
                  class="danger">This field is required</span>
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
            <router-link to="/workers" class="waves-effect waves-light btn red" style="margin-left: 20px">Cancel
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
const {ipcRenderer} = require('electron');
import router from '../router'
import {required} from 'vuelidate/lib/validators'

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
  mounted() {
    if (this.editPage) this.previousData()
  },
  computed: {
    editPage() {
      return Boolean(this.$route.params.firm)
    }
  },
  methods: {
    redirect() {
      router.push('/firms');
    },
    previousData() {
      this.newFirm.Name = this.$route.params.firm.Name;
      this.newFirm.Address = this.$route.params.firm.Address;
      this.newFirm.Active = this.$route.params.firm.Active ? {label: 'Active', value: '1'} : {
        label: 'Inactive',
        value: '0'
      };
      this.newFirm.Id = this.$route.params.firm.Id;
    },
    submitFirm() {
      if (this.editPage) this.editFirm()
      else this.addFirm()
    },
    addFirm() {
      let query = this.newFirm
      query.Active = this.newFirm.Active.value
      ipcRenderer.sendSync('add-firm', query) === true ? this.redirect() : console.log("DB Error");
    },
    editFirm() {
      let query = JSON.parse(JSON.stringify(this.newFirm))
      query.Active = this.newFirm.Active.value
      const req = ipcRenderer.sendSync('edit-firm', query);

      if (req === true) {
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
