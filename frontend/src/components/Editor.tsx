import * as React from 'react';

import Playground from './Playground';
import { Form /*, Glyphicon*/ } from 'react-bootstrap';
import './Editor.css';

interface State {
    shareReadMode: boolean;
}

class Editor extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { shareReadMode: false };
    }

    render() {
        return (
            <div className="flexy flexcomponent">
                <Form inline={true}>
                    Dateiname: <input className="form-control" type="text" />
                </Form>
                <Playground readOnly={this.state.shareReadMode} />
            </div>
        );
    }

}

export default Editor;
