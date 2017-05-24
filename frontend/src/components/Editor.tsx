import * as CodeMirror from 'react-codemirror';
import {Component} from 'react';

export interface Props {
}

class Editor extends Component<Props, any> {
    constructor(props: Props) {
        super(props);
        this.handleLoad = this.handleLoad.bind(this);
    }

    componentDidMount() {
        window.addEventListener('load', this.handleLoad);
    }

    handleLoad() {
        // $('myclass');  $ is available here
    }

    getInitialState() {
        return {
            code: '// Code',
        };
    }

    updateCode(newCode: string) {
        this.setState({
            code: newCode,
        });
    }

    render() {
        const options = {
            lineNumbers: true,
        };
        return <CodeMirror value={this.state.code} onChange={this.updateCode} options={options}/>;
    }
}

export default Editor;
