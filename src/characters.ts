import charactersImport from "./characters.json"

export type AttorneyCharacter = {
  name: string
  id: number
  pose: number
}

export type AttorneyEntry = {
  id: number,
  iid: number,
  text: string,
  poseId: number,
  pairPoseId: number|null,
  bubbleType: number,
  username: string,
  mergeNext: boolean,
  doNotTalk: boolean,
  goNext: boolean,
  poseAnimation: true,
  flipped: number|null,
  frameActions: unknown[],
  frameFades: unknown[],
  characterId: number|null,
  popupId: number|null,
  transition: unknown|null
}

export type AttorneySceneGroup = {
  iid: number,
  name: string,
  type: string,
  frames: AttorneyEntry[]
}

export type AttorneyScene = {
  type: string,
  options: {
    chatbox: number,
    textSpeed: number,
    textBlipFrequency: number,
    autoplaySpeed: number,
    continueSoundUrl: string,
  },
  groups: AttorneySceneGroup[],
  courtRecord: {
    evidence: unknown[],
    profiles: unknown[]
  },
  aliases: unknown[],
  pairs: unknown[],
  version: 4
}

export const characters = charactersImport as readonly AttorneyCharacter[]