<template>
    <div class="home">
        <img alt="Vue logo" src="../assets/logo.png">
        <HelloWorld msg="Welcome to Your Vue.js App"/>

        <div class="workers">
            <p v-for="worker in workers">{{worker.FirstName}} {{worker.LastName}}</p>
        </div>
    </div>
</template>

<script>
  // @ is an alias to /src
  import HelloWorld from '@/components/HelloWorld.vue'

  const electron = require('electron');
  const {ipcRenderer} = electron;
  // const $ = require("jquery");

  // ipcRenderer.send("mainWindowLoaded")
  // ipcRenderer.on("resultSent", function(evt, result){
  //   console.log(result);
  //   this.workers.push(result)
  //   result.forEach((el)=>{
  //     console.log(el)
  //     this.workers.push(el);
  //   })
  // });

  export default {
    name: 'home',
    components: {
      HelloWorld
    },
    created() {
      let workers = this.workers;
      ipcRenderer.send("mainWindowLoaded")
      ipcRenderer.on("resultSent", function (evt, result) {
          workers.push(result)

      });
    },
    data() {
      return {
        workers: []
      }
    }
  }
</script>
