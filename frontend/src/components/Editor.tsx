import * as React from 'react';

import Playground from './Playground';
import { Form /*, Glyphicon*/ } from 'react-bootstrap';
import { Database } from '../API';
import './Editor.css';

interface State {
    shareReadMode: boolean;
    code: string;
    fileName: string;
}

class Editor extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { shareReadMode: false, code: '', fileName: '' };

        this.onFileNameBlur = this.onFileNameBlur.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleFileNameChange = this.handleFileNameChange.bind(this);
    }

    render() {
        return (
            <div className="flexy flexcomponent">
                <Form inline={true}>
                    Dateiname: <input className="form-control" type="text" onBlur={this.onFileNameBlur}
                        onChange={this.handleFileNameChange} />
                </Form>
                <Playground readOnly={this.state.shareReadMode} onCodeChange={this.handleCodeChange} />
            </div>
        );
    }

    handleFileNameChange(evt: any) {
        let name = evt.target.value;
        this.setState(prevState => {
            return {fileName: name};
        });
    }

    handleCodeChange(newCode: string) {
        this.setState(prevState => {
            return {code: newCode};
        });
        if (this.state.fileName !== '') {
            Database.getInstance().then((db: Database) => {
                return db.saveFile(this.state.fileName, this.state.code);
            });
        }
    }

    onFileNameBlur(evt: any) {
        // save now!
        Database.getInstance().then((db: Database) => {
            return db.saveFile(this.state.fileName, this.state.code);
        });
    }

}

export default Editor;
