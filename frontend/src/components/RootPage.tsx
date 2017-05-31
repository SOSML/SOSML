import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';

class RootPage extends React.Component<any, any> {
    render() {
        return (
            <div>
                <MenuBar />
                <div className="container">
                    <MiniWindow content={
                        <CodeMirrorWrapper />
                    } title="SML" />
                </div>
            </div>);
    }
}

export default RootPage;
