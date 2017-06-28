import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
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

class Playground extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { output: '', code: '', sizeAnchor: 0 };

        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
    }

    render() {
        // <div className="container playground">
        let glyphLeft: string = 'resize-full';
        let glyphRight: string = 'resize-full';
        let lines: string[] = this.state.output.split('\n');
        let lineItems = lines.map((line) =>
            <div>{line}</div>
        );
        return (
            <div className="playground">
                <SplitterLayout onUpdate={this.handleSplitterUpdate}>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <CodeMirrorWrapper flex={true} onChange={this.handleCodeChange} />}
                            footer={(
                            <ButtonToolbar>
                                <Button bsSize="small" bsStyle="primary" onClick={this.handleRun}>Ausführen</Button>
                            </ButtonToolbar>
                        )} header={(
                            <ButtonToolbar className="pull-right">
                                <Button bsSize="small" onClick={this.handleLeftResize}>
                                    <Glyphicon glyph={glyphLeft} />
                                </Button>
                            </ButtonToolbar>
                        )} title="SML" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <p>{lineItems}</p>} header={(
                            <ButtonToolbar className="pull-right">
                                <Button bsSize="small" onClick={this.handleRightResize}>
                                    <Glyphicon glyph={glyphRight} />
                                </Button>
                            </ButtonToolbar>
                        )} title="Ausgabe" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                </SplitterLayout>
            </div>
        );
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
    }
}

export default Playground;
