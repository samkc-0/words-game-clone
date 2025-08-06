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
const initialState: State = {
  guesses: [],
  input: '',
  status: 'playing',
  solution: secret,
}

function init(initialState: State): State {
    const storedStatus = localStorage.getItem('status');
    const status: Status =
        storedStatus === 'won' || storedStatus === 'lost' || storedStatus === 'playing'
        ? storedStatus
        : 'playing';
    return { ...initialState, status };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_LETTER':
      if (state.input.length >= 5) return state
      return { ...state, input: state.input + action.letter }
    case 'REMOVE_LETTER':
      return { ...state, input: state.input.slice(0, -1) }
    case 'SUBMIT_GUESS':
      if (state.input.length !== 5) return state
      if (state.input === state.solution) {
        localStorage.setItem('status', 'won')
        return { ...state, guesses: [...state.guesses, state.input], status: 'won', input: '' }
      }
      if (state.guesses.length + 1 === MAX_GUESSES) {
        localStorage.setItem('status', 'lost')
        return { ...state, guesses: [...state.guesses, state.input], status: 'lost', input: '' }
      }
      return { ...state, guesses: [...state.guesses, state.input], input: '' }
    default:
      return state
  }
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
    <div className="App" onKeyDown={handleKeyPress} tabIndex={0}>
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
