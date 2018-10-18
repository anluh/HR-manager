<template>
    <div class="modal-wrapper">
        <button class="worker-btn" @click="openModal()">
            <slot><i class="danger far fa-trash-alt"></i></slot>
        </button>
        <transition name="fade">
            <div v-show="open" @click="closeModal()" class="popup__cover"></div>
        </transition>
        <transition name="fade">
            <div v-show="open" class="popup">
                <h5 class="popup__title"><slot name="popup-text">Are you sure?</slot></h5>
                <div class="popup__buttons">
                    <button @click="submit()" class="waves-effect btn-small btn">{{ submitBtn }}</button>
                    <button @click="closeModal()" v-if="cancelBtn" class="waves-effect btn-small btn red">Cancel</button>
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
    model: {
      prop: 'open',
      event: 'cancel'
    },
    props:{
      cancelBtn: {
        default: true
      },
      submitBtn: {
        type: String,
        default: 'Ok'
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
        this.$emit('submit')
      }
    }
  }
</script>

