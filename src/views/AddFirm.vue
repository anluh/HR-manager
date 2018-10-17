<template>
    <div class="add-worker">
        <div class="page-title">
            <h3>Add Worker</h3>
        </div>

        <div class="container">
            <form v-on:submit.prevent="addFirm()">
                <div class="input-field col s6 m6">
                    <input v-model="newFirm.name" id="firm_name" type="text" class="validate">
                    <label for="firm_name">Name</label>
                </div>
                <div class="input-field col s6 m6">
                    <input v-model="newFirm.address" id="firm_address" type="text" class="validate">
                    <label for="firm_address">Address</label>
                </div>
                <div class="input-field input-field--select col s12 m6">
                    <select id="firm_status" v-model="newFirm.active">
                        <option value="1">active</option>
                        <option value="0">inactive</option>
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

  export default {
    name: "addfirm",
    data() {
      return {
        newFirm: {
          name: '',
          address: '',
          active: null,
        },
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
        })(jQuery); // end of jQuery name space
        /* eslint-enable */
      }
    }
  }

</script>

<style lang="stylus">
    @import "../styles/variables.styl";
    @import "../styles/firms.styl";
</style>
