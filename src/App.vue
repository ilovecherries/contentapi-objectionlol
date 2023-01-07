<script setup lang="ts">
  import { ref } from 'vue';
  import { ContentAPI } from "contentapi-ts-bindings/dist/Helpers"
  import type { User, Message } from "contentapi-ts-bindings/dist/Views"
  import {RequestType} from "contentapi-ts-bindings/dist/Search/RequestType"
  import { SearchRequests, SearchRequest } from "contentapi-ts-bindings/dist/Search/SearchRequests"
  import type { AttorneyCharacter } from './characters';
  import { characters } from './characters';
  let x = 20

  const api = new ContentAPI("qcs.shsbs.xyz")

  let roomId = ref<number>()
  let idRange = ref<string>()

  async function pullMessages() {
    
  }
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title">ContentAPI-Objection.lol Converter</h1>
      <div>
        <div class="field">
          <label for="room-id" class="label">Room ID</label>
          <div class="control">
            <input type="number" name="room-id" id="room-id" class="input"
              placeholder="???" v-model="roomId">
          </div>
        </div>
        <div class="field">
          <label for="id-range" class="label">ID Range</label>
          <div class="control">
            <input type="text" name="id-range" id="id-range" class="input"
              placeholder="???-???" v-model="idRange">
          </div>
        </div>
        <div class="field">
          <button></button>
        </div>
      </div>
    </div>
    {{ x }}
  </section>
</template>

<style>
  @import "npm:bulma/css/bulma.min.css"
</style>