import React from "react";
import "./App.css";
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {Calculator} from "./calculator/calculator";

export default function App() {
    return (
        <Router>
            <Routes>
                <Route path="/calculator" element={<Calculator/>}/>
                <Route path="*" element={<Navigate to="/calculator" replace/>}/>
            </Routes>
        </Router>
    )
}