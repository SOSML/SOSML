import * as React from 'react';

import MiniWindow from './MiniWindow';
import CodeMirrorWrapper from './CodeMirrorWrapper';
import { Col, Grid } from 'react-bootstrap';
import './Playground.css';

interface State {
    hideRight: boolean;
}

class Playground extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { hideRight: true };
    }

    render() {
        // <div className="container playground">
        let stylesRight: any = {};
        if (this.state.hideRight) {
            stylesRight.display = 'none';
        }
        return (
            <Grid className="playground">
                <Col xs={(this.state.hideRight ? 12 : 6)} className="flexcomponent">
                    <MiniWindow content={
                        <CodeMirrorWrapper />
                    } title="SML" />
                </Col>
                <Col xs={6} style={stylesRight} />
            </Grid>
        );
    }
}

export default Playground;
