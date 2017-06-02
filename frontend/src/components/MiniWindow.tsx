import * as React from 'react';
import './MiniWindow.css';

export interface Props {
    title: string;
    footer?: any;
    content: any;
}

class MiniWindow extends React.Component<Props, any> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        let footerAdd = '';
        if (!this.props.footer) {
            footerAdd = 'no-content';
        }
        return (
            <div className="mini-window">
                <div className="window-header noselect">
                    {this.props.title}
                </div>
                <div className="window-content">
                    {this.props.content}
                </div>
                <div className={`window-footer ${footerAdd}`}>
                    {this.props.footer}
                </div>
            </div>);
    }
}

export default MiniWindow;
