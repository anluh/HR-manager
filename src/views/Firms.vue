<template>
    <div class="firms">
        <div class="page-title">
            <h3>{{ $t('firms') }}</h3>
        </div>

        <div class="view-wrapper">
            <transition name="slide-fade">
                <div v-if="deleteErr" class="toast toast--error">{{ $t('delete_firm_error') }}</div>
            </transition>

            <router-link to="/add/firm" class="add-worker-btn btn-floating btn-large waves-effect waves-light">
                <i class="fas fa-plus" style="font-size: 18px;"></i>
            </router-link>

            <table class="striped firms">
                <thead>
                <tr>
                    <th>№</th>
                    <th>{{ $t('name') }}</th>
                    <th>{{ $t('adress') }}</th>
                    <th>{{ $t('status') }}</th>
                </tr>
                </thead>

                <tbody>
                <tr v-for="(firm, index) in firms" :key="index">
                    <td>{{ index + 1 }}</td>
                    <td>{{ firm.Name }}</td>
                    <td>{{ firm.Address }}</td>
                    <td class="active" v-if="firm.Active === 1">{{ $t('active') }}</td>
                    <td class="inactive" v-if="firm.Active === 0">{{ $t('inactive') }}</td>
                    <td>
                        <router-link :to="{ name: 'editfirm', params: { id: firm.Id, firm: firm } }" class="worker-btn"><i class="fas fa-pencil-alt"></i></router-link>
                        <modal @submit="deleteFirm(firm)" submit-btn="Delete">
                            <i class="danger far fa-trash-alt"></i>
                            <div slot="popup-text">{{ $t('delete_firm') }}</div>
                        </modal>
                    </td>
                </tr>
                </tbody>
            </table>

        </div>
    </div>
</template>

<script>
  // import router from '../router'
  import modal from '@/components/modal.vue'
  const electron = require('electron');
  const {ipcRenderer} = electron;

  export default {
    name: "firms",
    components:{
      modal
    },
    data(){
      return {
        firms: [],
        deleteErr: false
      }
    },
    mounted(){
      ipcRenderer.send("printFirms");
      ipcRenderer.on("printFirms:res", (evt, result) => {
        this.firms = [...result]
      });
    },
    methods:{
      deleteFirm(firm){
        let vm = this;
        if(ipcRenderer.sendSync("delete-firm", firm) !== 'err_workers') {
          this.firms.splice(this.firms.indexOf(firm), 1);
        } else {
          this.deleteErr = true;
          setTimeout(function(){
            vm.deleteErr = false;
          }, 8000);
        }
      },
      beforeDestroy() {
        ipcRenderer.removeAllListeners();
      },
    }
  }
</script>

<style lang="stylus">
    @import "../styles/variables.styl";
    @import "../styles/main.styl";
    @import "../styles/firms.styl";
</style>
