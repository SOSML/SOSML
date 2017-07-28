import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import './Playground.css';
var SplitterLayout = require('react-splitter-layout').default; // MEGA-HAX because of typescript
SplitterLayout.prototype.componentDidUpdate = function(prevProps: any, prevState: any) {
    if (this.props.onUpdate && this.state.secondaryPaneSize !== prevState.secondaryPaneSize) {
        this.props.onUpdate(this.state.secondaryPaneSize);
    }
};

interface State {
    output: string;
    code: string;
    sizeAnchor: any;
    useServer: boolean;
    shareLink: string;
}

interface Props {
    readOnly: boolean;
    onCodeChange?: (x: string) => void;
    initialCode: string;
    fileControls: any;
}

class Playground extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            output: '', code: '', sizeAnchor: 0, useServer: false,
            shareLink: ''
        };

        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
        this.handleOutputChange = this.handleOutputChange.bind(this);
    }

    render() {
        let lines: string[] = this.state.output.split('\n');
        var key = 0;
        let lineItems = lines.map((line) =>
            <div key={line + (key++)}>{line}</div>
        );
        let code: string = this.props.initialCode;
        return (
            <div className="playground">
                <SplitterLayout onUpdate={this.handleSplitterUpdate}>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={(
                                <CodeMirrorWrapper flex={true} onChange={this.handleCodeChange} code={code}
                                readOnly={this.props.readOnly} outputCallback={this.handleOutputChange}
                                useInterpreter={!this.state.useServer} />
                            )}
                            header={(
                            <div className="headerButtons">
                                {this.props.fileControls}
                            </div>
                        )} title="SML" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <div>{lineItems}</div>}
                        title="Output" className="flexy" updateAnchor={this.state.sizeAnchor}
                        header={ (
                            <div className="headerButtons"/>
                        ) } />
                    </div>
                </SplitterLayout>
            </div>
        );
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleBrowserResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleBrowserResize);
    }

    handleSplitterUpdate(sizeAnchor: any) {
        this.setState({sizeAnchor});
    }

    handleLeftResize() {
        // Block is empty!
    }

    handleRightResize() {
        // Block is empty?
    }

    handleBrowserResize() {
        if (this.state.sizeAnchor === -2) {
            this.setState({sizeAnchor: -1});
        } else {
            this.setState({sizeAnchor: -2});
        }
    }

    handleCodeChange(newCode: string) {
        this.setState(prevState => {
            return {code: newCode};
        });
        if (this.props.onCodeChange) {
            this.props.onCodeChange(newCode);
        }
    }

    handleOutputChange(newOutput: string) {
        this.setState(prevState => {
            let ret: any = {output: newOutput};
            return ret;
        });
    }
}

export default Playground;
