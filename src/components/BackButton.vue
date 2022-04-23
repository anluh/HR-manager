<template>
    <a class="go-back-btn btn-floating btn-small waves-effect waves-light"  @click="Back()">
        <i class="fas fa-arrow-left" style="font-size: 18px;"></i>
    </a>
</template>

<script>
  export default {
    name: "BackButton",
    methods:{
      Back() {
        this.$router.go(-1)
      }
    }
  }
</script>

<style scoped>
.go-back-btn {
    position: absolute;
    left: 20px;
    background: white;
}
.go-back-btn i {
    color: #26a69a;
}
</style>

