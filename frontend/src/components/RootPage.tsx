import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import Editor from './Editor';
import Files from './Files';
import Help from './Help';
import FileIntermediate from './FileIntermediate';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import './RootPage.css';

class RootPage extends React.Component<any, any> {
    constructor() {
        super();
    }

    render() {
        return (
            <Router>
                <div className="rootPage">
                    <MenuBar />
                    <Route exact={true} path="/" component={Editor} />
                    <Route path="/files" component={Files} />
                    <Route path="/help" component={Help} />

                    <Route path="/file/:name" component={FileIntermediate} />
                </div>
            </Router>);
    }
}

export default RootPage;
