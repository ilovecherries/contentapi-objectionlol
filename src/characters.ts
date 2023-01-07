import charactersImport from "./characters.json"

export type AttorneyCharacter = {
  name: string
  id: number
  pose: number
}

export const characters = charactersImport as readonly AttorneyCharacter[]