import * as React from 'react';

class FileIntermediate extends React.Component<any, any> {
    componentDidMount() {
        if (this.props.match) {
            this.props.history.replace('/', {
                fileName: this.props.match.params.name,
                example: window.location.pathname.indexOf('/example') === 0
            });
        }
    }

    render() {
        return <div />;
    }
}

export default FileIntermediate;
