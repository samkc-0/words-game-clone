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
    if (storedState) 
      return JSON.parse(storedState);
    return initialState
}

function reducer(state: State, action: Action): State {
  let newState: State 
  switch (action.type) {
    case 'ADD_LETTER':
      if (state.input.length >= WORD_LENGTH) return state
      newState = { ...state, input: state.input + action.letter }
      break
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
  console.log("Setting state", newState)
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
    <div className="App" onKeyDown={handleKeyPress} tabIndex={0} autoFocus>
    <h1>{state.status}</h1>
    {(new Array(MAX_GUESSES)).fill(0).map((_, i) => {
      if (i === state.guesses.length) {
        return <div className="font-mono" key={i}>{state.input}</div>
      }
      else if (i < state.guesses.length) {
        return <div key={i}>{evalGuess(state.guesses[i], state.solution)}</div>
      }
      return <div key={i}>⬜⬜⬜⬜⬜</div>
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

export default App;
