import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import Hello from "./components/Hello";

ReactDOM.render(
    <Hello name="TypeScript" enthusiasmLevel={10}/>,
    document.getElementById('root') as HTMLElement
);
