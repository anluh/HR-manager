<template>
    <div class="firms">
        <div class="page-title">
            <h3>Firms</h3>
        </div>

        <div class="view-wrapper">

            <router-link to="/add/firm" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
                <i class="fas fa-plus" style="font-size: 18px;"></i>
            </router-link>

            <table class="striped firms">
                <thead>
                <tr>
                    <th>№</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Status</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="(firm, index) in firms" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ firm.Name }}</td>
                    <td>{{ firm.Address }}</td>
                    <td class="active" v-if="firm.Active === 1">active</td>
                    <td class="inactive" v-if="firm.Active === 0">inactive</td>
                    <td>
                        <router-link to="/edit/worker" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                        <button class="worker-btn" @click="deleteFirm(firm)"><i class="danger far fa-trash-alt"></i></button>
                    </td>
                </tr>
                </tbody>
            </table>

        </div>
    </div>
</template>

<script>
  // import router from '../router'

  const electron = require('electron');
  const {ipcRenderer} = electron;

  export default {
    name: "firms",
    data(){
      return {
        firms: [],
      }
    },
    created(){
      // let vm = this;
      let firms = this.firms;

      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", function (evt, result) {
        firms.push(result)
      });
    },
    methods:{
    deleteFirm(firm){
      ipcRenderer.sendSync("delete-firm", firm.Id);
      this.firms.splice(this.firms.indexOf(firm), 1);
    },
    }
  }
</script>

<style lang="stylus">
    @import "../styles/variables.styl";
    @import "../styles/main.styl";
    @import "../styles/firms.styl";
</style>
