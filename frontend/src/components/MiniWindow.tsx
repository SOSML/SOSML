import * as React from 'react';
import './MiniWindow.css';

export interface Props {
    title: string;
    footer?: any;
    content: any;
    className?: string;
}

class MiniWindow extends React.Component<Props, any> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        let footerAdd = '';
        let classAdd = '';
        if (this.props.className) {
            classAdd = this.props.className;
        }
        if (!this.props.footer) {
            footerAdd = 'no-content';
        }
        return (
            <div className={`mini-window ${classAdd}`}>
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
