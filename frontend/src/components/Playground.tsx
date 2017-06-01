import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import './Playground.css';

class Playground extends React.Component<any, any> {
    render() {
        return (
            <div className="container playground">
                <MiniWindow content={
                    <CodeMirrorWrapper />
                } title="SML" />
            </div>
        );
    }
}

export default Playground;
