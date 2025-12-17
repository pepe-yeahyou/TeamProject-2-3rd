import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Detail from './component/Detail';
import Write from "./pages/Write";

function App() {
    return (
        <Routes>
            <Route path={'/write'} element={<Write/>}/>
            <Route path={'/detail/:projectId'} element={<Detail/>}/>
        </Routes>
    );
}

export default App;