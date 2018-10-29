<template>
    <div class="modal-wrapper">
<<<<<<< HEAD
        <button class="worker-btn" @click.stop="openModal()">
=======
        <button class="worker-btn" @click="openModal()">
>>>>>>> 8f2f2640607e914683b70b0e458d9d6115cfedc0
            <slot></slot>
        </button>
        <transition name="fade">
            <div v-show="open" @click="closeModal()" class="popup__cover"></div>
        </transition>
        <transition name="fade">
            <div v-show="open" class="popup">
                <h6 class="popup__header"><slot name="popup-header"></slot></h6>
                <h5 class="popup__title"><slot name="popup-text">Are you sure?</slot></h5>
                <div class="popup__buttons">
<<<<<<< HEAD
                    <button @click.stop="submit()" class="waves-effect btn-small btn">{{ submitBtn }}</button>
                    <button @click.stop="closeModal()" v-if="cancelBtn" class="waves-effect btn-small btn red">Cancel</button>
=======
                    <button @click="submit()" class="waves-effect btn-small btn">{{ submitBtn }}</button>
                    <button @click="closeModal()" v-if="cancelBtn" class="waves-effect btn-small btn red">Cancel</button>
>>>>>>> 8f2f2640607e914683b70b0e458d9d6115cfedc0
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
  export default {
    name: "modal",
    data(){
      return {
        open: false
      }
    },
    created(){
      this.open = this.openProp;
    },
    props:{
      cancelBtn: {
        default: true
      },
      submitBtn: {
        type: String,
        default: 'Ok'
      },
      openProp: {
        type: Boolean,
        default: false
      }
    },
    methods:{
      openModal(){
        this.open = true;
      },
      closeModal(){
        this.open = false;
      },
      submit(){
        this.$emit('submit');
        this.open = false
      }
    }
  }
</script>

