import * as React from 'react';

import Playground from './Playground';
import { Form /*, Glyphicon*/ } from 'react-bootstrap';
import { Database } from '../API';
import './Editor.css';

interface State {
    shareReadMode: boolean;
    code: string;
    initialCode: string;
    fileName: string;
}

class Editor extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { shareReadMode: false, code: '', fileName: '',
            initialCode: this.unNullify(localStorage.getItem('tmpCode')) };

        this.onFileNameBlur = this.onFileNameBlur.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleFileNameChange = this.handleFileNameChange.bind(this);
    }

    componentDidMount() {
        if (this.props.history) {
            let state: any = this.props.history.location.state;
            if (state.fileName) {
                Database.getInstance().then((db: Database) => {
                    return db.getFile(state.fileName);
                }).then((content: string) => {
                    this.setState((oldState) => {
                        return {initialCode: content, fileName: state.fileName};
                    });
                    this.props.history.replace('/', {});
                });
            }
        }
    }

    render() {
        return (
            <div className="flexy flexcomponent">
                <Form inline={true}>
                    Dateiname: <input className="form-control" type="text" onBlur={this.onFileNameBlur}
                        value={this.state.fileName} onChange={this.handleFileNameChange} />
                </Form>
                <Playground readOnly={this.state.shareReadMode} onCodeChange={this.handleCodeChange}
                    initialCode={this.state.initialCode} />
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
        } else {
            localStorage.setItem('tmpCode', this.state.code);
        }
    }

    onFileNameBlur(evt: any) {
        // save now!
        if (this.state.fileName !== '') {
            Database.getInstance().then((db: Database) => {
                return db.saveFile(this.state.fileName, this.state.code);
            });
        } else {
            localStorage.setItem('tmpCode', this.state.code);
        }
    }

    private unNullify(str: string | null): string {
        if (typeof str === 'string') {
            return str;
        } else {
            return '';
        }
    }

}

export default Editor;
