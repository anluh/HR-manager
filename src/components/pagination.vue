<template>
    <div class="pagination-template">
        <!--<button :disabled="current === 1" class="pagination__left btn-small waves-effect waves-light" @click="changePage(prevPage)">Previous</button>-->
        <div class="pagination--wrapper">
            <div :class="{disabled: current === 1}" class="pagination__btn" @click="changePage(prevPage)"><i class="fas fa-chevron-left"></i></div>
            <ul class="pagination">
                <li
                        :class="{active: current === page}"
                        class="pagination__item waves-effect"
                        v-for="page in pages"
                        @click="changePage(page)"
                        :key="page">
                    <a>{{ page }}</a>
                </li>
            </ul>
            <div :class="{disabled: current === totalPages}" class="pagination__btn" @click="changePage(nextPage)"><i class="fas fa-chevron-right"></i></div>
            <!--<li class="pagination__mid">of {{ totalPages }}</li>-->
        </div>
        <!--<span v-for="page in pages" @click="changePage(page)" :key="page">{{ page }}</span>-->
        <!--<button :disabled="current === totalPages" class="pagination__right btn-small waves-effect waves-light" @click="changePage(nextPage)">Next</button>-->
    </div>
</template>

<script>
  export default {
    name: "pagination",
    props:{
      current:{
        type: Number,
        default: 1
      },
      perPage:{
        type: Number,
        default: 10
      },
      total:{
        type: Number,
        default: 1
      },
      pageRange:{
        type: Number,
        default: 2
      }
    },
    computed:{
      pages(){
        let pages = [];

        for(let i = this.rangeStart; i <= this.rangeEnd; i++){
          pages.push(i)
        }

        return pages
      },
      rangeStart(){
        let start = this.current - this.pageRange;

        return (start > 0) ? start : 1
      },
      rangeEnd(){
        let end = this.current + this.pageRange;

        return (end < this.totalPages) ? end : this.totalPages
      },
      totalPages(){
        return Math.ceil(this.total/this.perPage);
      },
      nextPage(){
        return this.current + 1
      },
      prevPage(){
        return this.current - 1
      }
    },
    methods:{
      changePage(page){
        this.$emit('page-changed', page)
      }
    }
  }
</script>

<style lang="stylus" scoped>
@import '../styles/variables.styl'
@import '../styles/pagination.styl'
</style>
