<template>
  <v-layout row wrap>
    <v-flex md12 lg6>
      <v-time-picker v-model="time" color="green lighten-1"></v-time-picker>
    </v-flex>
    <v-flex md12 lg6 class="hidden-xs-only">
      <v-time-picker v-model="time" color="green lighten-1" header-color="primary"></v-time-picker>
    </v-flex>
  </v-layout>
</template>

<script>
  export default {
    data () {
      return {
        time: null,
      }
    },
  }
</script>
