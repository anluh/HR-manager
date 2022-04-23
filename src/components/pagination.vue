<template>
  <div v-show="totalPages !== 1" class="pagination-template">
    <!--<button :disabled="current === 1" class="pagination__left btn-small waves-effect waves-light" @click="changePage(prevPage)">Previous</button>-->
    <div class="pagination--wrapper">
      <div :class="{disabled: current === 1}" class="pagination__btn" @click="changePage(prevPage)"><i
          class="fas fa-chevron-left"></i></div>
      <ul class="pagination">
        <li class="pagination__item">
          <a>{{ current }} of {{ totalPages }}</a>
        </li>
      </ul>
      <div :class="{disabled: current === totalPages}" class="pagination__btn" @click="changePage(nextPage)"><i
          class="fas fa-chevron-right"></i></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "pagination",
  props: {
    current: {
      type: Number,
      default: 1
    },
    perPage: {
      default: 10
    },
    total: {
      type: Number,
      default: 1
    },
    pageRange: {
      type: Number,
      default: 2
    }
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.perPage) || 1;
    },
    nextPage() {
      return this.current + 1 <= this.totalPages ? this.current + 1 : this.current
    },
    prevPage() {
      return this.current - 1 ? this.current - 1 : this.current
    }
  },
  methods: {
    changePage(page) {
      this.$emit('page-changed', page)
    }
  }
}
</script>

<style lang="stylus">
@import '../styles/variables.styl'
@import '../styles/pagination.styl'
</style>
