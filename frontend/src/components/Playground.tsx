import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button, ButtonToolbar, Glyphicon } from 'react-bootstrap';
import './Playground.css';
import {API as WebserverAPI} from '../API';

enum WindowState {
    LEFT,
    BOTH,
    RIGHT
}

interface State {
    windowState: WindowState;
    output: string;
    code: string;
}

class Playground extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { windowState: WindowState.LEFT, output: '', code: '' };

        this.handleLeftResize = this.handleLeftResize.bind(this);
        this.handleRightResize = this.handleRightResize.bind(this);
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
    }

    render() {
        // <div className="container playground">
        let stylesRight: any = {'left': 'calc(50% + 2px)', 'width': 'calc(50% - 2px)'};
        let stylesLeft: any = {'width': 'calc(50% - 2px)'};
        let glyphLeft: string = 'resize-full';
        let glyphRight: string = 'resize-full';
        switch (this.state.windowState) {
            case WindowState.LEFT:
                stylesRight.display = 'none';
                stylesLeft.width = '100%';
                glyphLeft = 'resize-small';
                break;
            case WindowState.RIGHT:
                stylesLeft.display = 'none';
                glyphRight = 'resize-small';
                stylesRight.left = '0px';
                stylesRight.width = '100%';
                break;
            default:
                break;
        }
        let lines: string[] = this.state.output.split('\n');
        let lineItems = lines.map((line) =>
            <div>{line}</div>
        );
        return (
            <div className="playground">
                <div style={stylesLeft} className="flexcomponent flexy">
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
                    )} title="SML" className="flexy" />
                </div>
                <div style={stylesRight} className="flexcomponent flexy">
                    <MiniWindow content={
                        <p>{lineItems}</p>} header={(
                        <ButtonToolbar className="pull-right">
                            <Button bsSize="small" onClick={this.handleRightResize}>
                                <Glyphicon glyph={glyphRight} />
                            </Button>
                        </ButtonToolbar>
                    )} title="Ausgabe" className="flexy" />
                </div>
            </div>
        );
    }

    handleLeftResize() {
        this.setState(prevState => {
            if (prevState.windowState === WindowState.LEFT) {
                return {windowState: WindowState.BOTH};
            } else {
                return {windowState: WindowState.LEFT};
            }
        });
    }

    handleRightResize() {
        this.setState(prevState => {
            if (prevState.windowState === WindowState.RIGHT) {
                return {windowState: WindowState.BOTH};
            } else {
                return {windowState: WindowState.RIGHT};
            }
        });
    }

    handleRun() {
        WebserverAPI.fallbackInterpreter(this.state.code).then((val) => {
            this.setState(prevState => {
                let ret: any = {output: val};
                if (prevState.windowState === WindowState.LEFT) {
                    ret.windowState = WindowState.BOTH;
                }
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
