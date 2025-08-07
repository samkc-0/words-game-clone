import { readFileSync } from 'fs'
import { join } from 'path'

const file = readFileSync(join(import.meta.dir, 'palabras.txt'), 'utf-8')

const palabras = file
  .trim()
  .split('\n')
  .map((w) => w.trim())

export function getDailyWord(): string {
  const today = new Date()
  const seed =
    today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const index = seededIndex(seed, palabras.length)
  return palabras[index]
}

export function validateGuess(guess: string) {
  return palabras.includes(guess.toLowerCase())
}
function seededIndex(seed: number, max: number): number {
  const x = Math.sin(seed) * 10000
  return Math.floor((x - Math.floor(x)) * max)
}
