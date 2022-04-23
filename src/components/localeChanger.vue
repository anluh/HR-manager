<template>
  <div class="locale-changer">
    <multiselect
      v-model="$i18n.locale"
      placeholder=""
      :allowEmpty="false"
      :searchable="false"
      :options="langs"
    >
      <span slot="noOptions">{{ $t('empty_list') }}</span>
    </multiselect>
  </div>
</template>

<script>
export default {
  name: 'locale-changer',
  data () {
    return { langs: ['en', 'cz'] }
  }
}
</script>
