<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ContentAPI, ContentAPI_Session } from "contentapi-ts-bindings/dist/Helpers"
import type { User, Message } from "contentapi-ts-bindings/dist/Views"
import { RequestType } from "contentapi-ts-bindings/dist/Search/RequestType"
import { SearchRequests, SearchRequest } from "contentapi-ts-bindings/dist/Search/SearchRequests"
import type { AttorneyEntry, AttorneyScene } from "./characters"
import { characters } from './characters'

const api = new ContentAPI("qcs.shsbs.xyz")

class UserContainer {
  public user: User
  public metadata: {
    characterId: number,
    censoredName: string
  }

  constructor(user: User) {
    this.user = user
    this.metadata = {
      characterId: 1,
      censoredName: ""
    }
  }

  poseId(): number {
    return (characters.find(c => c.id === this.metadata.characterId)?.pose) || 1
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

const roomId = ref<number | string>('')
const idRange = ref('')
const messages = ref<Message[]>([])
const users = ref<UserContainer[]>([])
const fetching = ref(false)
const session = ref<ContentAPI_Session|undefined>(undefined)
const username = ref("")
const password = ref("")
const loggingIn = ref(false)
const identity = ref<User|undefined>(undefined)

const associatedMessages = computed<[Message, UserContainer | undefined][]>(() => {
  return messages.value.map(msg => {
    const user = users.value.find(u => u.user.id === msg.createUserId)
    return [msg, user]
  })
})

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function generateEntries(): AttorneyEntry[] {
  return associatedMessages.value.map(([msg, user], i): AttorneyEntry => ({
    id: i === 0 ? -1 : 0,
    iid: i + 1,
    text: msg.text,
    poseId: user?.poseId() || 0,
    pairPoseId: null,
    bubbleType: 0,
    username: user?.user.username || "",
    mergeNext: false,
    doNotTalk: false,
    goNext: false,
    poseAnimation: true,
    flipped: null,
    frameActions: [],
    frameFades: [],
    characterId: null,
    popupId: null,
    transition: null
  }))
}

function exportEntries() {
  const entries = generateEntries()
  try {
    const data: AttorneyScene = {
      type: 'scene',
      options: {
        chatbox: 0,
        textSpeed: 35,
        textBlipFrequency: 64,
        autoplaySpeed: 500,
        continueSoundUrl: ''
      },
      groups: [{
        iid: 1,
        name: "Main",
        type: "n",
        frames: entries
      }],
      courtRecord: {
        evidence: [],
        profiles: []
      },
      aliases: [],
      pairs: [],
      version: 4
    }
    const jsonData = JSON.stringify(data).replace(/[^\x00-\x7F]/g, "")
    const b64data = btoa(jsonData)
    download("SBSExport.objection", b64data)
  } catch (e) {
    alert(e)
  }
}

async function pullMessages() {
  fetching.value = true
  try {
    const [first, last] = extractIdRange(idRange.value)
    const room = (typeof roomId.value === "string") ? undefined : roomId.value
    type Return = {
      message: Message[],
      user: User[]
    }
    const req = new SearchRequests(
      {
        sole: first,
        first: first - 1,
        last: last + 1,
        roomId: room || 0,
      },
      [
        new SearchRequest(RequestType.message, "*", (first === last ? "id = @sole" : "id > @first AND id < @last") + (room ? " AND contentId = @roomId" : ""), "id"),
        new SearchRequest(RequestType.user, "*", `id ${first === last ? "=" : "IN"} @message.createUserId`)
      ]
    )
    const resp = session.value ? 
      await api.request<Return>(req, session.value.headers) :
      await api.request<Return>(req)
    messages.value = resp.objects.message
    users.value = resp.objects.user.map(u => new UserContainer(u))
  } catch (e) {
    console.error(e)
  } finally {
    fetching.value = false
  }
}

async function refreshIndentity() {
  identity.value = await session.value?.getUserInfo()
}

async function login() {
  loggingIn.value = true
  try {
    const token = await api.login(username.value, password.value)
    session.value = new ContentAPI_Session(api, token)
    localStorage.setItem("token", token)
    await refreshIndentity()
  } catch (e) {
    alert(e)
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  session.value = undefined
  identity.value = undefined
  localStorage.removeItem("token")
}

onMounted(async () => {
  const token = localStorage.getItem("token")
  if (token !== null) {
    session.value = new ContentAPI_Session(api, token)
    await refreshIndentity()
  }
})

function objectionLolIcon(id: number): string {
  return `https://objection.lol/images/characters/${id}/icon.png`
}
</script>

<template>
  <section class="section">
    <div class="container">
      <h1 class="title">ContentAPI-Objection.lol Converter</h1>
      <template v-if="session === undefined">
        <h2 class="is-size-4">Login</h2>
        <form @submit.prevent="login">
          <div class="field">
            <label for="username" class="label">Username</label>
            <div class="control">
              <input type="text" name="username" id="username" v-model="username"
                class="input">
            </div>
          </div>
          <div class="field">
            <label for="password" class="label">Password</label>
            <div class="control">
              <input type="password" name="password" id="password" v-model="password"
                class="input">
            </div>
          </div>
          <div class="field">
            <button class="button is-info" type="submit">Login</button>
          </div>
        </form>
      </template>
      <div v-else>
        Logged in as {{ identity?.username }}
        <div class="field">
          <button class="button is-danger" @click="logout">Logout</button>
        </div>
      </div>
      <h2 class="is-size-4">Query messages</h2>
      <form @submit.prevent="pullMessages">
        <div class="field">
          <label for="room-id" class="label">Room ID</label>
          <div class="control">
            <input type="number" id="room-id" class="input" placeholder="???" v-model.number="roomId">
          </div>
        </div>
        <div class="field">
          <label for="id-range" class="label">ID Range</label>
          <div class="control">
            <input type="text" id="id-range" class="input" placeholder="???-???" v-model="idRange" required>
          </div>
        </div>
        <div class="field">
          <button :class="`button is-primary ${fetching ? 'is-loading' : ''}`">
            Pull
          </button>
        </div>
      </form>
      <template v-if="messages.length">
        <button class="button is-success" @click="exportEntries">
          Export Entries
        </button>
        <h2 class="is-size-4">Users</h2>
        <div class="box" v-for="user in users" :key="user.user.id" :id="`user-${user.user.id}`">
          <h3 class="is-size-5">{{ user.user.username }}</h3>
          <div class="field">
            <label :for="`character-select-${user.user.id}`" class="label">
              Character
            </label>
            <div class="select">
              <select :id="`character-select-${user.user.id}`" v-model="user.metadata.characterId">
                <option v-for="c in characters" :value="c.id">
                  {{ c.name }}
                </option>
              </select>
            </div>
            <figure class="image is-64x64">
              <img :src="objectionLolIcon(user.metadata.characterId)">
            </figure>
          </div>
          <div class="field">
            <label class="label" :for="`censored-name-${user.user.id}`">
              Censored Name
            </label>
            <input type="text" class="input" :id="`censored-name-${user.user.id}`"
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
                  {{
                    user?.metadata.censoredName || user?.user.username
                      || msg.createUserId
                  }}
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