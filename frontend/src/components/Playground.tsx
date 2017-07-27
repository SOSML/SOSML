import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Button, Modal } from 'react-bootstrap';
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
    useServer: boolean;
    shareLink: string;
}

interface Props {
    readOnly: boolean;
    onCodeChange?: (x: string) => void;
    initialCode: string;
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
        this.handleRun = this.handleRun.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleSplitterUpdate = this.handleSplitterUpdate.bind(this);
        this.handleBrowserResize = this.handleBrowserResize.bind(this);
        this.handleOutputChange = this.handleOutputChange.bind(this);
        this.handleSwitchMode = this.handleSwitchMode.bind(this);
        this.handleShare = this.handleShare.bind(this);
        this.closeShareModal = this.closeShareModal.bind(this);
    }

    render() {
        let lines: string[] = this.state.output.split('\n');
        var key = 0;
        let lineItems = lines.map((line) =>
            <div key={line + (key++)}>{line}</div>
        );
        let code: string = this.props.initialCode;
        let evaluateIn: string = (this.state.useServer) ? 'Ausführen auf dem Server' : 'Ausführen im Browser';
        let executeOnServer: JSX.Element | undefined;
        if (this.state.useServer) {
            executeOnServer = (
                <Button bsSize="small" bsStyle="primary" onClick={this.handleRun}>Ausführen</Button>
            );
        }
        let modal = (
            <Modal show={this.state.shareLink !== ''} onHide={this.closeShareModal}>
                <Modal.Header closeButton={true}>
                    <Modal.Title>Teilen link</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <pre>{this.state.shareLink}</pre>
                    Diesen Link können Sie anderen Personen geben, die dann den
                    Code sehen können den Sie gerade geschrieben haben.
                    Wenn Sie ihren Code weiter verändern wird dies nicht von
                    dem Link übernommen, Sie müssen in diesem Fall noch einen
                    neuen Link erstellen.
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.closeShareModal}>Schließen</Button>
                </Modal.Footer>
            </Modal>
        );
        return (
            <div className="playground">
                <SplitterLayout onUpdate={this.handleSplitterUpdate}>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={(
                                <CodeMirrorWrapper flex={true} onChange={this.handleCodeChange} code={code}
                                readOnly={this.props.readOnly} outputCallback={this.handleOutputChange}
                                useInterpreter={!this.state.useServer} />
                            )}
                            footer={(
                            <div>
                                {executeOnServer}
                                <div className="miniSpacer" />
                                {evaluateIn}
                                <div className="miniSpacer" />
                                <Button bsSize="small" bsStyle="primary" onClick={this.handleSwitchMode}>
                                    Umschalten
                                </Button>
                                <div className="miniSpacer" />
                                <Button bsSize="small" bsStyle="primary" onClick={this.handleShare}>Teilen</Button>
                            </div>
                        )} title="SML" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                    <div className="flexcomponent flexy">
                        <MiniWindow content={
                            <div>{lineItems}</div>}
                        title="Ausgabe" className="flexy" updateAnchor={this.state.sizeAnchor} />
                    </div>
                </SplitterLayout>
                {modal}
            </div>
        );
    }

    closeShareModal() {
        this.setState({shareLink: ''});
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

    handleShare() {
        WebserverAPI.shareCode(this.state.code).then((hash) => {
            this.setState(prevState => {
                return {shareLink: window.location.host + '/share/' + hash};
            });
        });
    }

    handleSwitchMode() {
        this.setState(prevState => {
            return {useServer: !prevState.useServer, output: ''};
        });
    }
}

export default Playground;
