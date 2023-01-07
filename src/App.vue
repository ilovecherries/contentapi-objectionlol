<script lang="ts">
import { defineComponent, ref } from 'vue';
import { ContentAPI } from "contentapi-ts-bindings/dist/Helpers"
import type { User, Message } from "contentapi-ts-bindings/dist/Views"
import {RequestType} from "contentapi-ts-bindings/dist/Search/RequestType"
import { SearchRequests, SearchRequest } from "contentapi-ts-bindings/dist/Search/SearchRequests"
import { characters } from './characters';

const api = new ContentAPI("qcs.shsbs.xyz")

type UserContainer = {
  user: User,
  metadata: {
    characterId: number,
    censoredName: string
  }
}

function extractIdRange(input: string): number[] {
  const idRegex = /(\d+)(\-(\d+))?/
  const match = idRegex.exec(input)
  if (match === null) {
    throw new Error("id range is not properly formatted")
  }
  let range = [parseInt(match[1]), parseInt(match[3])]
  if (isNaN(range[1])) range[1] = range[0]
  if (range[0] > range[1]) throw new Error('the first number in the range is larger than the second')
  return range
}

export default defineComponent({
  data() {
    return {
      roomId: undefined as number|undefined,
      idRange: '',
      messages: [] as Message[],
      users: [] as UserContainer[],
      fetching: false,
    }
  },
  methods: {
    async pullMessages() {
      this.fetching = true
      try {
        const [first, last] = extractIdRange(this.idRange)
        const resp = await api.request<{
          message: Message[],
          user: User[]
        }>(new SearchRequests(
          {
            sole: first,
            first: first-1,
            last: last+1
          },
          [
            new SearchRequest(RequestType.message, "*", first === last ? "id = @sole" : "id > @first AND id < @last", "id"),
            new SearchRequest(RequestType.user, "*", `id ${first === last ? "=" : "IN"} @message.createUserId`)
          ]
        ))
        this.messages = resp.objects.message
        this.users = resp.objects.user.map(u => ({
          user: u,
          metadata: {
            characterId: 1,
            censoredName: ""
          }
        } as UserContainer))
      } catch (e) {
        console.error(e)
      } finally {
        this.fetching = false
      }
    },
    objectionLolIcon(id: number): string {
      return `https://objection.lol/images/characters/${id}/icon.png`
    }

  },
  computed: {
    characters() {
      return characters
    },
    associatedMessages(): [Message, UserContainer|undefined][] {
      return this.messages.map(msg => {
        const user = this.users.find(u => u.user.id === msg.createUserId)
        return [msg, user]
      })
    }
  }
})
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title">ContentAPI-Objection.lol Converter</h1>
      <div>
        <div class="field">
          <label for="room-id" class="label">Room ID</label>
          <div class="control">
            <input type="number" id="room-id" class="input"
              placeholder="???" v-model="roomId">
          </div>
        </div>
        <div class="field">
          <label for="id-range" class="label">ID Range</label>
          <div class="control">
            <input type="text" id="id-range" class="input"
              placeholder="???-???" v-model="idRange">
          </div>
        </div>
        <div class="field">
          <button :class="`button is-primary ${fetching ? 'is-loading' : ''}`" @click="pullMessages">Pull</button>
        </div>
      </div>
      <template v-if="messages.length">
        <h2 class="is-size-4">Users</h2>
        <div class="box" v-for="user in users" :key="user.user.id"
          :id="`user-${user.user.id}`">
          <h3 class="is-size-5">{{ user.user.username }}</h3>
          <div class="field">
            <label :for="`character-select-${user.user.id}`"
              class="label">
              Character
            </label>
            <div class="select">
              <select :id="`character-select-${user.user.id}`"
                v-model="user.metadata.characterId">
                <option v-for="c in characters" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <figure class="image is-64x64">
              <img :src="objectionLolIcon(user.metadata.characterId)" >
            </figure>
          </div>
          <div class="field">
            <label class="label">Censored Name</label>
            <input type="text" class="input"
              v-model.lazy="user.metadata.censoredName">
          </div>
        </div>
        <h2 class="is-size-4">Pulled Messages</h2>
        <table class="table is-fullwidth is-bordered">
          <thead>
            <tr>
              <th>Message ID</th>
              <th>User</th>
              <th>Message Content</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[msg, user] in associatedMessages" :key="msg.id">
              <td>{{ msg.id }}</td>
              <td>
                <a :href="`#user-${msg.createUserId}`">
                  {{ user?.metadata.censoredName || user?.user.username
                    || msg.createUserId }}
                </a>
              </td>
              <td>{{ msg.text }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </section>
</template>

<style>
  @import "npm:bulma/css/bulma.min.css";
</style>