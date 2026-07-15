import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { TrackerCanvas } from './tracker/TrackerCanvas'
import { EditorCanvas } from './editor/EditorCanvas'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TrackerCanvas />} />
        <Route path="/editor" element={<EditorCanvas />} />
      </Routes>
    </BrowserRouter>
  )
}
