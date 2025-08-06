import { useReducer, KeyboardEvent, useEffect } from 'react'
import { Text } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'

import "./index.css"
type Status = 'playing' | 'won' | 'lost'
const PERSISTENT = true

function getDailyWord(): string {
  return "apple"
}

interface State {
  guesses: string[]
  input: string
  status: Status
}

type Action =
  | { type: 'ADD_LETTER'; letter: string }
  | { type: 'REMOVE_LETTER' }
  | { type: 'SUBMIT_GUESS' }

const MAX_GUESSES = 6
const WORD_LENGTH = 5
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'

const initialState: State = {
  guesses: [],
  input: '',
  status: 'playing',
}
function init(initialState: State): State {
    if (!PERSISTENT) return initialState
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
      if (state.input === getDailyWord()) {
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
  console.log("Saving state:", newState)
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

function Rig() {
  const { camera, size } = useThree()
  useEffect(() => {
    const PADDING = 1.5
    const SPACING = 1.2
    const contentWidth = WORD_LENGTH * SPACING - (SPACING - 1) + PADDING
    const contentHeight = MAX_GUESSES * SPACING - (SPACING - 1) + PADDING
    const zoom = Math.min(size.width / contentWidth, size.height / contentHeight)
    ;(camera as any).zoom = zoom
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
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
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#f0f0f0' }} tabIndex={0} autoFocus onKeyDown={handleKeyPress}>
      <Canvas orthographic>
        <Rig />
        <ambientLight intensity={0.7} />
        <pointLight position={[0, 0, 5]} />
        {Array.from({ length: MAX_GUESSES }, (_, i) => {
          if (i < state.guesses.length) 
            return <Row key={i} guess={state.guesses[i] ?? ''} rowIndex={i} colorize={true} />
          else if (i === state.guesses.length) {
            return <Row key={i} guess={state.input} rowIndex={i} colorize={false} /> 
          }
          return <Row key={i} guess="" rowIndex={i} colorize={false} />
        })}
      </Canvas>
    </div>
  )
}


function Letter({ letter, letterColor = 'black', boxColor = 'lightgray', x = 0 }: { letter: string; letterColor?: string, boxColor?: string, x?: number }) {
    return (
        <group position={[x, 0, 0]}>
            <mesh>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={boxColor} />
            </mesh>
            <Text color={letterColor} position={[0, 0, 0.6]} fontSize={0.8} anchorX="center" anchorY="middle">
                {letter.toUpperCase()}
            </Text>
        </group>
    )
}


function Row({ guess = '', rowIndex = 0, colorize = false }: { guess: string, rowIndex: number, colorize: boolean }) {
    const letterSpacing = 1.2
    const rowY = (MAX_GUESSES / 2 - 0.5) * letterSpacing - rowIndex * letterSpacing
    const getX = (i: number) => i * letterSpacing - ((WORD_LENGTH - 1) * letterSpacing) / 2

    const determineBoxColor = (i: number) => {
        if (!colorize) return '#d3d6da' // Light gray for empty/current row
        if (guess[i] === getDailyWord()[i]) {
            return '#6aaa64' // Correct (Green)
        } else if (getDailyWord().includes(guess[i])) {
            return '#c9b458' // Present (Yellow)
        }
        return '#787c7e' // Absent (Dark Gray)
    }

    const letterColor = colorize ? 'white' : 'black'

    return (
        <group position={[0, rowY, 0]}>
            {guess.padEnd(WORD_LENGTH).split('').map((c, i) =>
                <Letter
                    x={getX(i)}
                    key={i}
                    letter={c || ' '}
                    boxColor={determineBoxColor(i)}
                    letterColor={letterColor}
                />)}
        </group>
    )
}

function validateStoredState(parsed: State): boolean {
  const isValidGuess = (guess: any) =>
    typeof guess === 'string' && guess.length === getDailyWord().length

  if (!Array.isArray(parsed.guesses)) {
    console.log("storedState.guesses was not an array")
    return false
  }

  if (parsed.guesses.length > MAX_GUESSES) {
    console.log("storedState.guesses was longer than MAX_GUESSES")
    return false
  }

  if (!parsed.guesses.every(isValidGuess)) {
    console.log("storedState.guesses contained an invalid guess")
    return false
  }

  if (typeof parsed.input !== 'string') {
    console.log("storedState.input was not a string")
    return false
  }

  if (typeof parsed.status !== 'string') {
    console.log("storedState.status was not a string")
    return false
  }

  if (!['playing', 'won', 'lost'].includes(parsed.status)) {
    console.log(`storedState.status was ${parsed.status}, want 'playing', 'won', or 'lost'`)
    return false
  }

  return true
}


export default App;
