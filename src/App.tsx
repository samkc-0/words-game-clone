import { useReducer, KeyboardEvent } from 'react'
import "./index.css"

type Status = 'playing' | 'won' | 'lost'

interface State {
  guesses: string[]
  input: string
  status: Status
  solution: string
}

type Action =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }

const secret = 'apple'
const MAX_GUESSES = 6
const WORD_LENGTH = 5

const initialState: State = {
  guesses: [],
  input: '',
  status: 'playing',
  solution: secret,
}
function init(initialState: State): State {
    const storedState = localStorage.getItem('state');
    if (storedState) {
      const parsed = JSON.parse(storedState)
      if (validateStoredState(parsed)) {
        return parsed
      }
    }
    console.log("Stored state was not found or invalid, using defaults")
    return initialState
}

function reducer(state: State, action: Action): State {
  if (state.status !== 'playing') return state
  let newState: State 
  switch (action.type) {
    case 'ADD_LETTER':
      if (state.input.length >= WORD_LENGTH) return state
      return { ...state, input: state.input + action.letter }
    case 'REMOVE_LETTER':
      newState = { ...state, input: state.input.slice(0, -1) }
      break
    case 'SUBMIT_GUESS':
      if (state.input.length !== WORD_LENGTH) return state
      if (state.input === state.solution) {
        newState = { ...state, guesses: [...state.guesses, state.input], status: 'won', input: '' }
      }
      else if (state.guesses.length + 1 === MAX_GUESSES) {
        newState = { ...state, guesses: [...state.guesses, state.input], status: 'lost', input: '' }
      }
      else newState = { ...state, guesses: [...state.guesses, state.input], input: '' }
      break
    default:
      return state
  }
  console.log("Saving state:", {...newState, solution: secret.split("").map(c => "*").join("")})
  localStorage.setItem('state', JSON.stringify(newState))
  return newState
}

function evalGuess(guess: string, solution: string) {
  return guess.split('').map((c, i) => {
    if (c == solution[i])
      return '🟩'
    else if (solution.includes(c))
      return '🟨'
    return '⬛'
  }).join('')
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState, init)

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      dispatch({ type: 'SUBMIT_GUESS' })
    } else if (e.key === 'Backspace') {
      dispatch({ type: 'REMOVE_LETTER' })
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      dispatch({ type: 'ADD_LETTER', letter: e.key.toLowerCase() })
    }
  }

  return (
    <div className="App font-mono" onKeyDown={handleKeyPress} tabIndex={0} autoFocus>
    {(new Array(MAX_GUESSES)).fill(0).map((_, i) => {
      if (i === state.guesses.length) {
        return <div className="lineheight-2" key={i}>{state.input.padEnd(WORD_LENGTH, '⬜')}</div>
      }
      else if (i < state.guesses.length) {
        return <div className="lineheight-2" key={i}>{evalGuess(state.guesses[i], state.solution)}</div>
      }
      return <div className="lineheight-2" key={i}>⬜⬜⬜⬜⬜</div>
    })}
    </div>
  )
}

interface CellProps {
  letter: string
  i: number
  className: string
}
function Cell({ letter, i, className }: CellProps) {
  return <div className={className}>{letter.toUpperCase()}</div>
}

function validateStoredState(parsed: State): boolean {
    if (!Array.isArray(parsed.guesses)) {
      console.log("storedState.guesses was not an array")
      return false
    } 
    if (parsed.guesses.length > MAX_GUESSES) 
      {
        console.log("storedState.guesses was longer than MAX_GUESSES")
    return false
      }
    if (parsed.guesses.every((guess: string) => typeof guess !== 'string' || guess.length > WORD_LENGTH))
      {
        console.log("storedState.guesses contained an invalid guess")
    return false
      }
    if (typeof parsed.input !== 'string'){
      console.log("storedState.input was not a string")
      return false
    }
    if (typeof parsed.status !== 'string' ){
      console.log("storedState.status was not a string")
      return false
    } 
    if (typeof parsed.solution !== 'string'){
      console.log("storedState.solution was not a string")
      return false
    }
    if (parsed.solution.length !== WORD_LENGTH) {
      console.log(`storedState.solution has ${parsed.solution.length} letters, want ${WORD_LENGTH}`) 
      return false
    }
    if (!['playing', 'won', 'lost'].includes(parsed.status)){
      console.log(`storedState.status was ${parsed.status}, want 'playing', 'won', or 'lost'`)
      return false
    }
    return true
}


export default App;
