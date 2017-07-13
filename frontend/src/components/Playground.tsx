import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button, ButtonToolbar /*, Glyphicon*/ } from 'react-bootstrap';
import './Playground.css';
import {API as WebserverAPI} from '../API';
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
}

interface Props {
    readOnly: boolean;
    onCodeChange?: (x: string) => void;
}

class Playground extends React.Component<Props, State> {
    constructor(props: any) {
        super(props);

        this.state = { output: '', code: '', sizeAnchor: 0 };

        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
    }

    render() {
        // <div className="container playground">
        // let glyphLeft: string = 'resize-full';
        // let glyphRight: string = 'resize-full';
        let lines: string[] = this.state.output.split('\n');
        let lineItems = lines.map((line) =>
            <div>{line}</div>
        );
        let codeNull: string | null = localStorage.getItem('tmpCode');
        let code: string = '';
        if (typeof codeNull === 'string') {
            code = codeNull;
        }
        return (
            <div className="playground">
                <SplitterLayout onUpdate={this.handleSplitterUpdate}>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={(
                                <CodeMirrorWrapper flex={true} onChange={this.handleCodeChange} code={code}
                                readOnly={this.props.readOnly} />
                            )}
                            footer={(
                            <ButtonToolbar>
                                <Button bsSize="small" bsStyle="primary" onClick={this.handleRun}>Ausführen</Button>
                            </ButtonToolbar>
                        )} /* header={(
                            <ButtonToolbar className="pull-right">
                                <Button bsSize="small" onClick={this.handleLeftResize}>
                                    <Glyphicon glyph={glyphLeft} />
                                </Button>
                            </ButtonToolbar>
                        )} */ title="SML" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <p>{lineItems}</p>} /* header={(
                            <ButtonToolbar className="pull-right">
                                <Button bsSize="small" onClick={this.handleRightResize}>
                                    <Glyphicon glyph={glyphRight} />
                                </Button>
                            </ButtonToolbar>
                        )} */ title="Ausgabe" className="flexy" updateAnchor={this.state.sizeAnchor} />
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
        this.setState({sizeAnchor: -1});
    }

    handleRun() {
        WebserverAPI.fallbackInterpreter(this.state.code).then((val) => {
            this.setState(prevState => {
                let ret: any = {output: val};
                return ret;
            });
        });
    }

    handleCodeChange(newCode: string) {
        this.setState(prevState => {
            return {code: newCode};
        });
        localStorage.setItem('tmpCode', newCode);
        if (this.props.onCodeChange) {
            this.props.onCodeChange(newCode);
        }
    }
}

export default Playground;
