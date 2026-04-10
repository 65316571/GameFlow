import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Overview from './pages/Overview'
import Library from './pages/Library'
import Timer from './pages/Timer'
import Calendar from './pages/Calendar'
import Wiki from './pages/Wiki'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/library" element={<Library />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/wiki" element={<Wiki />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
