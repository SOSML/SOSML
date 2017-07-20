import * as React from 'react';

const CodeMirror: any = require('react-codemirror');
require('codemirror/lib/codemirror.css');
require('codemirror/mode/mllike/mllike.js');
require('codemirror/addon/edit/matchbrackets.js');
import './CodeMirrorWrapper.css';
import {API} from '../API';

class CodeMirrorSubset {
    cm: any;

    constructor(cm: any) {
        this.cm = cm;
    }

    getCode(pos: any): string {
        return this.cm.getRange(pos, {'line': this.cm.lineCount() + 1, 'ch' : 0}, '\n');
    }

    markText(from: any, to: any, style: string) {
        return this.cm.markText(from, to, {
            className: style
        });
    }
}

enum ErrorType {
    OK = 0, // Interpret successfull
    INCOMPLETE, // The given partial string was incomplete SML code
    INTERPRETER, // The interpreter failed, e.g. compile error etc.
    SML // SML raised an exception
}

class IncrementalInterpretationHelper {
    semicoli: any[];
    states: any[];
    markers: any[];
    output: any[];
    debounceTimeout: any;
    debounceMinimumPosition: any;
    debounceCallNecessary: boolean;
    interpreter: any;

    constructor() {
        this.semicoli = [];
        this.states = [];
        this.markers = [];
        this.output = [];

        this.debounceCallNecessary = false;

        this.interpreter = API.createInterpreter();
    }

    clear() {
        this.semicoli.length = 0;
        this.states.length = 0;
    }

    handleChangeAt(pos: any, added: string[], removed: string[], codemirror: CodeMirrorSubset) {
        /*
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
        let remainingText = codemirror.getCode(basePos);
        if (baseIndex !== -1) {
            remainingText = remainingText.substr(1);
            basePos.ch = basePos.ch + 1;
        }
        this.reEvaluateFrom(basePos, baseIndex, anchor, remainingText, codemirror);
        */
        this.doDebounce(pos, added, removed, codemirror);
    }

    private doDebounce(pos: any, added: string[], removed: string[], codemirror: CodeMirrorSubset) {
        clearTimeout(this.debounceTimeout);
        if (!this.debounceCallNecessary) {
            if (!this.isHandlingNecessary(pos, added, removed)) {
                return;
            } else {
                this.debounceCallNecessary = true;
            }
        }
        if (!this.debounceMinimumPosition || this.compare(pos, this.debounceMinimumPosition) === -1) {
            this.debounceMinimumPosition = pos;
        }
        this.debounceTimeout = setTimeout(() => {
            this.debounceTimeout = null;
            this.debounceCallNecessary = false;
            let minPos = this.debounceMinimumPosition;
            this.debounceMinimumPosition = null;
            this.debouncedHandleChangeAt(minPos, codemirror);
        }, 400);
    }

    private debouncedHandleChangeAt(pos: any, codemirror: CodeMirrorSubset) {
        let anchor = this.binarySearch(pos);
        this.deleteAllAfter(anchor);
        let baseIndex = this.findBaseIndex(anchor);
        let basePos: any;
        if (baseIndex !== -1) {
            basePos = this.copyPos(this.semicoli[baseIndex]);
        } else {
            basePos = {line: 0, ch: 0};
        }
        let remainingText = codemirror.getCode(basePos);
        if (baseIndex !== -1) {
            remainingText = remainingText.substr(1);
            basePos.ch = basePos.ch + 1;
        }
        this.reEvaluateFrom(basePos, baseIndex, anchor, remainingText, codemirror);
    }

    private copyPos(pos: any): any {
        return {line: pos.line, ch: pos.ch};
    }

    private reEvaluateFrom(basePos: any, baseIndex: number, anchor: number, remainingText: string,
                           codemirror: CodeMirrorSubset) {
        let splitByLine: string[] = remainingText.split('\n');
        let lastPos = basePos;
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
                    let ret = this.evaluate(previousState, partial);
                    let semiPos = {line: (basePos.line + i), ch: sc + lineOffset};
                    if (ret[1] === ErrorType.OK) {
                        this.addSemicolon(semiPos, null, null);
                        partial += ';';
                    } else {
                        this.addSemicolon(semiPos, ret[0], codemirror.markText(lastPos, semiPos, 'eval-success'));
                        lastPos = this.copyPos(semiPos);
                        lastPos.ch++;
                        previousState = ret[0];

                        partial = ''; // ONLY do this if the evaluation was successfull, else append ';' to partial
                    }
                    /*
                    let newState = {'partial': partial, 'prev': previousState};
                    let semiPos = {line: (basePos.line + i), ch: sc + lineOffset};
                    if (partial.indexOf('NOPE') !== -1 && partial.indexOf(';') === -1) {
                        // Simulate failure
                        this.addSemicolon(semiPos, null, null);
                        partial += ';';
                    } else {

                        this.addSemicolon(semiPos, newState, codemirror.markText(lastPos, semiPos, 'eval-success'));
                        lastPos = this.copyPos(semiPos);
                        lastPos.ch++;
                        previousState = newState;

                        partial = ''; // ONLY do this if the evaluation was successfull, else append ';' to partial
                    }*/
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

    private evaluate(oldState: any, partial: string): [any, ErrorType, any] {
        let ret: any;
        try {
            if (oldState === null) {
                ret = this.interpreter.interpret(partial);
            } else {
                ret = this.interpreter.interpret(partial, oldState);
            }
        } catch (e) {
            // TODO: switch over e's type
            return [null, ErrorType.INTERPRETER, e];
        }
        if (ret[1]) {
            return [ret[0], ErrorType.SML, ret[2]];
        } else {
            return [ret[0], ErrorType.OK, null];
        }
    }

    private addSemicolon(pos: any, newState: any, marker: any) {
        this.semicoli.push(pos);
        this.states.push(newState);
        this.output.push('');
        this.markers.push(marker);
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
        this.output.length = index + 1;
        for (let i = index + 1; i < this.markers.length; i++) {
            if (this.markers[i]) {
                this.markers[i].clear();
            }
        }
        this.markers.length = index + 1;
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
        this.evalHelper.handleChangeAt(change.from, change.text, change.removed, new CodeMirrorSubset(codemirror));
    }
}

export default CodeMirrorWrapper;
