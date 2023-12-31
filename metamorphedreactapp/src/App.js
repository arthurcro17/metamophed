import './App.css';
import MainPage from "./MainPage";
import { Routes, Route } from "react-router-dom";
import ProductTemplate from './ProductTemplate';

function App() {
  return (
    <Routes>
      <Route path='' element={<MainPage/>} />
      <Route path='/productTemplate' element={<ProductTemplate/>}/>
    </Routes>
  );
}

export default App;
