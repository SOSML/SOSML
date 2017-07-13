import * as React from 'react';

const CodeMirror: any = require('react-codemirror');
require('codemirror/lib/codemirror.css');
require('codemirror/mode/mllike/mllike.js');
require('codemirror/addon/edit/matchbrackets.js');
import './CodeMirrorWrapper.css';

export interface Props {
    flex?: boolean;
    onChange?: (x: string) => void;
    code?: string;
    readOnly?: boolean;
}

class CodeMirrorWrapper extends React.Component<Props, any> {
    editor: any;

    constructor(props: Props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    render() {
        const options = {
            lineNumbers: true,
            mode: 'mllike',
            indentUnit: 4,
            matchBrackets: true,
            lineWrapping: true,
            readOnly: this.props.readOnly ? true : false
        };
        let classAdd = '';
        if (this.props.flex) {
            classAdd = 'flexy flexcomponent';
        }
        let value = '';
        if (this.props.code) {
            value = this.props.code;
        }
        return (
            <CodeMirror className={classAdd} ref={(editor: any) => {this.editor = editor; }}
                onChange={this.handleChange}
                value={value} options={options}/>
        );
    }

    componentDidMount() {
        var GCodeMirror = this.editor.getCodeMirrorInstance();
        let keyMap = GCodeMirror.keyMap;
        keyMap.default['Shift-Tab'] = 'indentLess';
        keyMap.default.Tab = function(cm: any) {
            if (cm.somethingSelected()) {
                return cm.indentSelection('add');
            } else {
                return GCodeMirror.commands.insertSoftTab(cm);
            }
        };
        this.editor.getCodeMirror().refresh();
    }

    handleChange(newValue: string) {
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }
    }
}

export default CodeMirrorWrapper;
