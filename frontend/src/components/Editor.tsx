import * as React from 'react';

import Playground from './Playground';
import { Form , Alert, Button } from 'react-bootstrap';
import { Database, API } from '../API';
import './Editor.css';

const FEEDBACK_NONE = 0;
const FEEDBACK_SUCCESS = 1;
const FEEDBACK_FAIL = 2;

interface State {
    shareReadMode: boolean;
    shareHash: string;
    code: string;
    initialCode: string;
    fileName: string;
    savedFeedback: number;
    savedFeedbackTimer: any;
}

class Editor extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            shareReadMode: false,
            code: '',
            fileName: '',
            initialCode: '',
            shareHash: '',
            savedFeedback: FEEDBACK_NONE,
            savedFeedbackTimer: null
        };

        this.onFileNameBlur = this.onFileNameBlur.bind(this);
        this.handleCodeChange = this.handleCodeChange.bind(this);
        this.handleFileNameChange = this.handleFileNameChange.bind(this);
        this.handleRedirectToEdit = this.handleRedirectToEdit.bind(this);
        this.handleSave = this.handleSave.bind(this);
    }

    componentDidMount() {
        if (this.props.history && this.props.history.location.state) {
            let state: any = this.props.history.location.state;
            if (state.fileName) {
                let promis: Promise<string>;
                if (state.example) {
                    promis = API.getCodeExample(state.fileName);
                } else {
                    promis = Database.getInstance().then((db: Database) => {
                        return db.getFile(state.fileName);
                    });
                }
                promis.then((content: string) => {
                    this.setState((oldState) => {
                        return {initialCode: content, fileName: state.fileName};
                    });
                });
                this.props.history.replace('/', {});
                return;
            } else if (state.shareHash) {
                API.loadSharedCode(state.shareHash).then((content: string) => {
                    this.setState((oldState) => {
                        return {initialCode: content};
                    });
                });
                this.props.history.replace('/', {});
                return;
            }
        }
        if (this.props.match && this.props.match.params && this.props.match.params.hash) {
            API.loadSharedCode(this.props.match.params.hash).then((content: string) => {
                this.setState((oldState) => {
                    return {initialCode: content, shareReadMode: true, shareHash: this.props.match.params.hash};
                });
            });
            return;
        }
        this.setState({initialCode: this.unNullify(localStorage.getItem('tmpCode'))});
    }

    render() {
        let topBar: any;
        let fileForm: any;
        if (this.state.shareReadMode) {
            topBar = (
                <Alert bsStyle="info">
                    Du betrachtest eine geteilte Datei. Um deine eigene Version dieser zu erstellen
                    <div className="miniSpacer" />
                    <Button bsStyle="success" onClick={this.handleRedirectToEdit}>klicke hier</Button>
                </Alert>
            );
        } else {
            let style: any = {};
            if (this.state.savedFeedback === FEEDBACK_SUCCESS) {
                style['background-color'] = '#AAFFAA';
            } else if (this.state.savedFeedback === FEEDBACK_FAIL) {
                style['background-color'] = '#FFAAAA';
            }
            fileForm = (
                <Form inline={true} className="inlineBlock">
                    Dateiname: <input className="form-control" type="text" onBlur={this.onFileNameBlur}
                        value={this.state.fileName} onChange={this.handleFileNameChange}
                        style={style} />
                    <div className="miniSpacer" />
                    <Button bsSize="small" bsStyle="primary" onClick={this.handleSave}>
                        Speichern
                    </Button>
                </Form>
            );
        }
        return (
            <div className="flexy flexcomponent">
                {topBar}
                <Playground readOnly={this.state.shareReadMode} onCodeChange={this.handleCodeChange}
                    initialCode={this.state.initialCode} fileControls={fileForm}  />
            </div>
        );
    }

    handleRedirectToEdit() {
        this.props.history.push('/', {shareHash: this.state.shareHash});
    }

    handleFileNameChange(evt: any) {
        let name = evt.target.value;
        this.setState(prevState => {
            return {fileName: name};
        });
    }

    restartFeedbackClear(feedback: number) {
        if (this.state.savedFeedbackTimer !== null) {
            clearTimeout(this.state.savedFeedbackTimer);
        }
        let timer = setTimeout(() => {
            this.setState({savedFeedback: FEEDBACK_NONE, savedFeedbackTimer: null});
        }, 1300);
        this.setState({savedFeedback: feedback, savedFeedbackTimer: timer});
    }

    handleSave() {
        if (this.state.fileName !== '') {
            Database.getInstance().then((db: Database) => {
                return db.saveFile(this.state.fileName, this.state.code);
            }).then(() => {
                this.restartFeedbackClear(FEEDBACK_SUCCESS);
            }).catch(() => {
                this.restartFeedbackClear(FEEDBACK_FAIL);
            });
        } else {
            this.restartFeedbackClear(FEEDBACK_FAIL);
        }
    }

    handleCodeChange(newCode: string) {
        if (this.state.shareReadMode) {
            return;
        }
        this.setState(prevState => {
            return {code: newCode};
        });
        localStorage.setItem('tmpCode', newCode);
    }

    onFileNameBlur(evt: any) {
        // save now!
        /*
        if (this.state.fileName !== '') {
            Database.getInstance().then((db: Database) => {
                return db.saveFile(this.state.fileName, this.state.code);
            });
        } else {
            localStorage.setItem('tmpCode', this.state.code);
        }
        */
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
