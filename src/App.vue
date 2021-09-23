<template>
  <div id="app" :class="{ collapsed: navCollapsed}">
    <div id="nav" class="z-depth-4">
      <router-link to="/"><div class="nav__item"><i class="fas fa-home"></i><span>Home</span></div></router-link>
      <router-link to="/workers"><div class="nav__item"><i class="fas fa-briefcase"></i><span>Workers</span></div></router-link>
      <router-link to="/firms"><div class="nav__item"><i class="far fa-building"></i><span>Firms</span></div></router-link>
      <router-link to="/hours"><div class="nav__item"><i class="far fa-file-alt"></i><span>Hours</span></div></router-link>
      <router-link to="/deposit"><div class="nav__item"><i class="fas fa-dollar-sign"></i><span>Deposit</span></div></router-link>
      <router-link to="/report"><div class="nav__item"><i class="fas fa-hand-holding-usd"></i><span>Report</span></div></router-link>
      <a class="toogle-menu"><i @click="navCollapsed ? navCollapsed = false : navCollapsed = true" class="fas fa-chevron-circle-down"></i></a>
    </div>
    <div v-if="dataBaseExist" id="router-view">
      <router-view/>
    </div>
  </div>
</template>

<script>
  import {CreateDefaultDataBase} from "./database";
  const electron = require('electron');
  const {ipcRenderer} = electron;

  export default {
    mounted() {
      CreateDefaultDataBase()
      ipcRenderer.on('ChangeCurrentDB:res', () => {
        this.dataBaseExist = true
      });
    },
    data() {
      return {
        dataBaseExist: false,
        navCollapsed: false
      }
    }
  }
</script>

<style lang="stylus">
@import "styles/variables.styl";
@import "styles/fa-icons.min.css";
@import "styles/materialize.min.css";
@import "styles/main.styl";

</style>
