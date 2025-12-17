import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Detail from './component/Detail';

function App() {
    return (
        <Routes>
            <Route path={'/detail/:projectId'} element={<Detail/>}/>
        </Routes>
    );
}

export default App;
