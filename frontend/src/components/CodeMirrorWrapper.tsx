import * as React from 'react';

const CodeMirror: any = require('react-codemirror');
require('codemirror/lib/codemirror.css');
require('codemirror/mode/mllike/mllike.js');
require('codemirror/addon/edit/matchbrackets.js');
import './CodeMirrorWrapper.css';

class IncrementalInterpretationHelper {
    semicoli: any[];
    states: any[];

    constructor() {
        this.semicoli = [];
        this.states = [];
    }

    clear() {
        this.semicoli.length = 0;
        this.states.length = 0;
    }

    handleChangeAt(pos: any, added: string[], removed: string[], codeProvider: (pos: any) => string) {
        if (!this.isHandlingNecessary(pos, added, removed)) {
            // console.log('NO');
            return;
        }
        // console.log('YEA');
        let anchor = this.binarySearch(pos);
        this.deleteAllAfter(anchor);
        let baseIndex = this.findBaseIndex(anchor);
        let basePos: any;
        if (baseIndex !== -1) {
            basePos = this.copyPos(this.semicoli[baseIndex]);
        } else {
            basePos = {line: 0, ch: 0};
        }
        let remainingText = codeProvider(basePos);
        if (baseIndex !== -1) {
            remainingText = remainingText.substr(1);
            basePos.ch = basePos.ch + 1;
        }
        this.reEvaluateFrom(basePos, baseIndex, anchor, remainingText);
    }

    private copyPos(pos: any): any {
        return {line: pos.line, ch: pos.ch};
    }

    private reEvaluateFrom(basePos: any, baseIndex: number, anchor: number, remainingText: string) {
        let splitByLine: string[] = remainingText.split('\n');
        // console.log(remainingText);
        let partial = '';
        let previousState = (baseIndex === -1) ? null : this.states[baseIndex];
        for (let i = 0; i < splitByLine.length; i++) {
            let lineOffset = 0;
            if (i === 0) {
                lineOffset = basePos.ch;
            }
            let start = -1;
            let line = splitByLine[i];
            let sc: number;
            if (i !== 0) {
                partial += '\n';
            }
            while ((sc = line.indexOf(';', start + 1)) !== -1) {
                partial += line.substring(start + 1, sc);
                if (baseIndex >= anchor) {
                    // actually need to handle this

                    // TODO: eval
                    let newState = {'partial': partial, 'prev': previousState};
                    if (partial.indexOf('NOPE') !== -1 && partial.indexOf(';') === -1) {
                        // Simulate failure
                        this.addSemicolon({line: (basePos.line + i), ch: sc + lineOffset}, null);
                        partial += ';';
                    } else {

                        this.addSemicolon({line: (basePos.line + i), ch: sc + lineOffset}, newState);
                        previousState = newState;

                        partial = ''; // ONLY do this if the evaluation was successfull, else append ';' to partial
                    }
                } else { // no need
                    partial += ';';
                }
                baseIndex++;
                start = sc;
            }
            partial += line.substr(start + 1);
        }
        // console.log(this);
    }

    private addSemicolon(pos: any, newState: any) {
        this.semicoli.push(pos);
        this.states.push(newState);
    }

    private stringArrayContains(arr: string[], search: string) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].indexOf(search) !== -1) {
                return true;
            }
        }
        return false;
    }

    private isHandlingNecessary(pos: any, added: string[], removed: string[]) {
        if (this.stringArrayContains(added, ';') || this.stringArrayContains(removed, ';')) {
            return true;
        }
        if (this.semicoli.length === 0) {
            return false;
        }
        let lastSemicolon = this.semicoli[this.semicoli.length - 1];
        if (this.compare(lastSemicolon, pos) === -1) {
            return false;
        }
        return true;
    }

    private findBaseIndex(index: number): any {
        for (let i = index; i >= 0; i--) {
            if (this.states[i] !== null) {
                return i;
            }
        }
        return -1;
    }

    private deleteAllAfter(index: number) {
        this.semicoli.length = index + 1;
        this.states.length = index + 1;
    }

    private binarySearch(pos: any): number {
        let left = 0;
        let right = this.semicoli.length - 1;
        while (left <= right) {
            let center = Math.floor((left + right) / 2);
            let element = this.semicoli[center];
            let cmp = this.compare(pos, element);
            if (cmp === -1) {
                right = center - 1;
                if (left > right) {
                    return center - 1; // the element left of center is the next best element
                }
            } else if (cmp === 1) {
                left = center + 1;
                if (left > right) {
                    return center; // center is the next best element
                }
            } else {
                return center - 1;
            }
        }
        return -1;
    }

    private compare(posa: any, posb: any) {
        if (posa.line === posb.line) {
            return Math.sign(posa.ch - posb.ch);
        } else {
            return Math.sign(posa.line - posb.line);
        }
    }
}

export interface Props {
    flex?: boolean;
    onChange?: (x: string) => void;
    code?: string;
    readOnly?: boolean;
}

class CodeMirrorWrapper extends React.Component<Props, any> {
    editor: any;
    evalHelper: IncrementalInterpretationHelper;

    constructor(props: Props) {
        super(props);

        this.evalHelper = new IncrementalInterpretationHelper();

        this.handleChange = this.handleChange.bind(this);
        this.handleChangeEvent = this.handleChangeEvent.bind(this);
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

    componentDidUpdate(prevProps: Props, prevState: any) {
        if (prevProps.code !== this.props.code) {
            if (this.editor) {
                this.editor.getCodeMirror().setValue(this.props.code);
            }
        }
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
        let cm: any = this.editor.getCodeMirror();
        cm.refresh();
        cm.on('change', this.handleChangeEvent);

        // TODO: propagate value
        this.handleChange(this.editor.getCodeMirror().getValue());
        this.evalHelper.clear();
    }

    componentWillUnmount() {
        let cm: any = this.editor.getCodeMirror();
        cm.off('change', this.handleChangeEvent);
    }

    /*
    This is the react-codemirror change handler
    */
    handleChange(newValue: string) {
        if (this.props.onChange) {
            this.props.onChange(newValue);
        }
    }

    /*
    This is the codemirror change handler
    */
    handleChangeEvent(codemirror: any, change: any) {
        // console.log(change);
        // console.log(codemirror.getValue());
        this.evalHelper.handleChangeAt(change.from, change.text, change.removed, (pos: any) => {
            return codemirror.getRange(pos, {'line': codemirror.lineCount() + 1, 'ch' : 0}, '\n');
        });
    }
}

export default CodeMirrorWrapper;
