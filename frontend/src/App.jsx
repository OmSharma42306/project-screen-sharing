import { TeacherScreenShare } from './pages/TeacherScreenShare'
import { StudentsScreenReceiver } from './pages/StudentsScreenReceiver'
import {Route,Routes,BrowserRouter} from "react-router-dom"
function App() {


  return (
    <BrowserRouter>
    <>
    <Routes>
    <Route path='/teacher' element={<TeacherScreenShare/>}></Route>
    <Route path='/student' element={<StudentsScreenReceiver/>}></Route>
    
    </Routes>
    </>
    </BrowserRouter >
  )
}

export default App
