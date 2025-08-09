import {
  useReducer,
  KeyboardEvent,
  useEffect,
  useState,
  JSX,
  Dispatch,
} from 'react'
import { Text } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'

import './index.css'
type Status = 'playing' | 'won' | 'lost'
const PERSISTENT = true

interface State {
  guesses: string[]
  input: string
  status: Status
  word: string | null
}

type Action =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }
  | { type: 'SET_WORD'; word: string }
  | { type: 'CLEAR_INPUT' }

const MAX_GUESSES = 6
const WORD_LENGTH = 5
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzñáéíóúü'.split('')

const initialState: State = {
  guesses: [],
  input: '',
  status: 'playing',
  word: null,
}
function init(initialState: State): State {
  if (!PERSISTENT) return initialState

  const today = new Date().toISOString().slice(0, 10)
  const lastPlayed = localStorage.getItem('lastPlayed')

  if (lastPlayed !== today) {
    localStorage.removeItem('state')
    localStorage.setItem('lastPlayed', today)
    console.log('New day, new game!')
    return initialState
  }

  const storedState = localStorage.getItem('state')
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState)
      if (validateStoredState(parsed)) {
        return parsed
      }
    } catch (e) {
      console.error('Error parsing stored state:', e)
      // Fallback to initial state if parsing fails
    }
  }

  console.log('Stored state was not found or invalid, using defaults')
  return initialState
}

function reducer(state: State, action: Action): State {
  let newState: State
  if (action.type === 'SET_WORD') {
    newState = { ...state, word: action.word }
    localStorage.setItem('state', JSON.stringify(newState))
    return newState
  }
  if (state.word == null) return state
  if (state.status !== 'playing') return state
  switch (action.type) {
    case 'ADD_LETTER':
      if (state.input.length >= WORD_LENGTH) return state
      return { ...state, input: state.input + action.letter }
    case 'REMOVE_LETTER':
      newState = { ...state, input: state.input.slice(0, -1) }
      break
    case 'CLEAR_INPUT':
      newState = { ...state, input: '' }
      break
    case 'SUBMIT_GUESS':
      if (state.input.length !== WORD_LENGTH) return state
      if (state.input === state.word) {
        newState = {
          ...state,
          guesses: [...state.guesses, state.input],
          status: 'won',
          input: '',
        }
      } else if (state.guesses.length + 1 === MAX_GUESSES) {
        newState = {
          ...state,
          guesses: [...state.guesses, state.input],
          status: 'lost',
          input: '',
        }
      } else
        newState = {
          ...state,
          guesses: [...state.guesses, state.input],
          input: '',
        }
      break
    default:
      return state
  }
  localStorage.setItem('state', JSON.stringify(newState))
  return newState
}

function Rig() {
  const { camera, size } = useThree()
  useEffect(() => {
    const PADDING = 1.5
    const SPACING = 1.2
    const contentWidth = WORD_LENGTH * SPACING - (SPACING - 1) + PADDING
    const contentHeight = MAX_GUESSES * SPACING - (SPACING - 1) + PADDING
    const zoom = Math.min(
      size.width / contentWidth,
      size.height / contentHeight,
    )
    ;(camera as any).zoom = zoom
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState, init)
  const [pendingAccent, setPendingAccent] = useState<string | null>(null)
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set())
  const [waiting, setWaiting] = useState(false)
  useEffect(() => {
    if (state.word != null) return
    fetch('/api/daily')
      .then((res) => res.json())
      .then((data) =>
        dispatch({ type: 'SET_WORD', word: data.word.toLowerCase() }),
      )
      .catch((error) => {
        console.error('Error fetching daily word:', error)
      })
  }, [])

  useEffect(() => {
    setGuessedLetters(new Set(state.guesses.join('')))
  }, [state.guesses])

  const handleSubmit = async () => {
    if (state.input.length !== WORD_LENGTH) return
    setWaiting(true)
    await fetch('/api/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guess: state.input,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result === true) dispatch({ type: 'SUBMIT_GUESS' })
        else dispatch({ type: 'CLEAR_INPUT' })
      })
      .catch((error) => console.error('Error checking guess:', error)) // Log the error
      .finally(() => setWaiting(false))
  }

  const handleKeyPress = async (e: KeyboardEvent) => {
    if (waiting) return
    if (pendingAccent) {
      const composed = composeAccent(pendingAccent, e.key)
      if (composed) {
        dispatch({ type: 'ADD_LETTER', letter: composed })
      } else {
        dispatch({ type: 'ADD_LETTER', letter: pendingAccent })
        if (/^[a-zA-ZñÑ]$/.test(e.key)) {
          dispatch({ type: 'ADD_LETTER', letter: e.key.toLowerCase() })
        }
      }
      setPendingAccent(null)
      return
    }

    if (e.key === 'Enter') {
      await handleSubmit()
    } else if (e.key === 'Backspace') {
      dispatch({ type: 'REMOVE_LETTER' })
    } else if (/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ]$/.test(e.key)) {
      dispatch({ type: 'ADD_LETTER', letter: e.key.toLowerCase() })
    } else if (e.key === 'Dead') {
      const accent = e.shiftKey ? '¨' : '´'
      setPendingAccent(accent)
    }
  }
  if (state.word == null) {
    return <div className="animate-spin text-3xl justify-center">⏳</div>
  }
  return (
    <div
      id="root"
      tabIndex={0}
      autoFocus
      onKeyDown={handleKeyPress}
      className="flex flex-col h-full"
      style={{ height: '100vh', backgroundColor: 'black' }}
    >
      <Canvas orthographic style={{ height: '66.67vh', position: 'fixed' }}>
        <Rig />
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 5]} />
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          if (i < state.guesses.length)
            return (
              <Row
                compareWord={state.word}
                key={i}
                guess={state.guesses[i] ?? ''}
                rowIndex={i}
              />
            )
          else if (i === state.guesses.length) {
            return <Row key={i} guess={state.input} rowIndex={i} />
          }
          return <Row key={i} guess="" rowIndex={i} />
        })}
      </Canvas>
      <Keyboard
        dispatch={dispatch}
        guessedLetters={Array.from(guessedLetters)}
        handleSubmit={handleSubmit}
      />
    </div>
  )
}

function Letter({
  letter,
  letterColor = 'black',
  boxColor = 'lightgray',
  x = 0,
}: {
  letter: string
  letterColor?: string
  boxColor?: string
  x?: number
}) {
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      <Text
        color={letterColor}
        position={[0, 0, 0.6]}
        fontSize={0.8}
        anchorX="center"
        anchorY="middle"
      >
        {letter.toUpperCase()}
      </Text>
    </group>
  )
}

interface RowProps {
  compareWord?: string | null
  guess: string
  rowIndex: number
}
function Row({ compareWord = null, guess, rowIndex }: RowProps) {
  const letterSpacing = 1.2
  const rowY =
    (MAX_GUESSES / 2 - 0.5) * letterSpacing - rowIndex * letterSpacing
  const getX = (i: number) =>
    i * letterSpacing - ((WORD_LENGTH - 1) * letterSpacing) / 2

  const determineBoxColor = (i: number) => {
    if (compareWord == null) return '#d3d6da'
    if (guess[i] === compareWord[i]) {
      return 'lime'
    } else if (compareWord.includes(guess[i])) {
      return '#FFEA00'
    }
    return '#787c7e'
  }

  const letterColor = compareWord != null ? 'white' : 'black'

  return (
    <group position={[0, rowY, 0]}>
      {guess
        .padEnd(WORD_LENGTH)
        .split('')
        .map((c, i) => (
          <Letter
            x={getX(i)}
            key={i}
            letter={c || ' '}
            boxColor={determineBoxColor(i)}
            letterColor={letterColor}
          />
        ))}
    </group>
  )
}

function validateStoredState(parsed: State): boolean {
  const isValidGuess = (guess: any) =>
    typeof guess === 'string' && guess.length === WORD_LENGTH

  if (!Array.isArray(parsed.guesses)) {
    console.log('storedState.guesses was not an array')
    return false
  }

  if (parsed.guesses.length > MAX_GUESSES) {
    console.log('storedState.guesses was longer than MAX_GUESSES')
    return false
  }

  if (!parsed.guesses.every(isValidGuess)) {
    console.log('storedState.guesses contained an invalid guess')
    return false
  }

  if (typeof parsed.input !== 'string') {
    console.log('storedState.input was not a string')
    return false
  }

  if (typeof parsed.status !== 'string') {
    console.log('storedState.status was not a string')
    return false
  }

  if (!['playing', 'won', 'lost'].includes(parsed.status)) {
    console.log(
      `storedState.status was ${parsed.status}, want 'playing', 'won', or 'lost'`,
    )
    return false
  }

  return true
}

function composeAccent(accent: string, letter: string): string | null {
  const map: Record<string, Record<string, string>> = {
    '´': {
      a: 'á',
      A: 'Á',
      e: 'é',
      E: 'É',
      i: 'í',
      I: 'Í',
      o: 'ó',
      O: 'Ó',
      u: 'ú',
      U: 'Ú',
    },
    // optional: add circumflex, tilde, grave, etc
  }

  return map[accent]?.[letter] ?? null
}

function Keyboard({
  dispatch,
  guessedLetters,
  handleSubmit,
}: {
  dispatch: Dispatch<Action>
  guessedLetters: string[]
  handleSubmit: () => void
}): JSX.Element {
  const getKeyColor = (letter: string) => {
    return guessedLetters.includes(letter) ? 'bg-gray-500' : 'bg-gray-200'
  }

  return (
    <div className="fixed bottom-0 flex flex-col items-center justify-end h-[40vh] w-full gap-1 p-2">
      <div className="flex gap-0.5 w-1/2">
        {['á', 'é', 'í', 'ó', 'ú', 'ü'].map((letter) => (
          <button
            key={letter}
            onClick={() => dispatch({ type: 'ADD_LETTER', letter })}
            className={`keyboard-key flex-1 text-lg rounded-sm md:text-base h-12 ${getKeyColor(
              letter,
            )}`}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 w-full">
        {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((letter) => (
          <button
            key={letter}
            onClick={() => dispatch({ type: 'ADD_LETTER', letter })}
            className={`keyboard-key flex-1 text-lg rounded-sm md:text-base h-12 ${getKeyColor(
              letter,
            )}`}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 w-full">
        {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'].map((letter) => (
          <button
            key={letter}
            onClick={() => dispatch({ type: 'ADD_LETTER', letter })}
            className={`keyboard-key flex-1 text-lg rounded-sm md:text-base h-12 ${getKeyColor(
              letter,
            )}`}
          >
            {letter.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="flex gap-0.5 w-full">
        <button
          onClick={handleSubmit}
          className="keyboard-key enter-key flex-[1.5] text-lg rounded-sm md:text-base h-12 bg-gray-200"
        >
          ENTER
        </button>
        {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map((letter) => (
          <button
            key={letter}
            onClick={() => dispatch({ type: 'ADD_LETTER', letter })}
            className={`keyboard-key flex-1 text-lg rounded-sm md:text-base h-12 ${getKeyColor(
              letter,
            )}`}
          >
            {letter.toUpperCase()}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'REMOVE_LETTER' })}
          className="keyboard-key backspace-key flex-[1.5] text-lg rounded-sm md:text-base h-12 bg-gray-200"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}

export default App
