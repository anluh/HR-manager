<template>
    <div class="modal-wrapper">
        <button class="worker-btn" @click.stop="openModal()">
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
                    <button @click.stop="submit()" class="waves-effect btn-small btn red">{{ submitBtn }}</button>
                    <button @click.stop="closeModal()" v-if="cancelBtn" class="waves-effect btn-small btn">Cancel</button>
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
    mounted(){
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

