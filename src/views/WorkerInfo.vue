<template>
    <div class="page-title">
        <h3>Worker "{{worker.Name}}" Info</h3>
    </div>
</template>

<script>
  export default {
    name: "workerinfo",
    data(){
      return {
        worker: {}
      }
    },
    created(){
      this.worker = this.$route.params.worker;
    }
  }
</script>

<style scoped>

</style>
