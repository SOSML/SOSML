import * as React from 'react';
import './MiniWindow.css';

export interface Props {
    title: string;
    footer?: any;
    header?: any;
    content: any;
    className?: string;
    updateAnchor?: any;
}

interface State {
    collapseStatus: boolean;
}

class MiniWindow extends React.Component<Props, State> {
    mainInstance: HTMLElement;

    constructor(props: Props) {
        super(props);
        this.state = {
            'collapseStatus' : false,
        };

    }

    componentDidUpdate (prevProps: any, prevState: any) {
        if (prevProps.updateAnchor !== this.props.updateAnchor && this.mainInstance) {
            let width = this.mainInstance.clientWidth;
            let collapseStatus = false;
            if (width < 100) {
                collapseStatus = true;
            }
            this.setState({collapseStatus});
        }
    }

    render() {
        let footerAdd = '';
        let classAdd = '';
        if (this.state.collapseStatus) {
            classAdd = 'mini-collapsed ';
        }
        if (this.props.className) {
            classAdd += this.props.className;
        }
        if (!this.props.footer) {
            footerAdd = 'no-content';
        }
        return (
            <div className={`mini-window ${classAdd}`} ref={(ref: HTMLElement) => this.mainInstance = ref}>
                <div className="window-header noselect">
                    <div className="window-title">{this.props.title}</div> {this.props.header}
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
