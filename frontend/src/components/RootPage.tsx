import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import Editor from './Editor';
import Files from './Files';
import Help from './Help';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import { Database } from '../API';
import './RootPage.css';

class RootPage extends React.Component<any, any> {
    constructor() {
        super();
        
        Database.getInstance().init();
    }

    render() {
        return (
            <Router>
                <div className="rootPage">
                    <MenuBar />
                    <Route exact={true} path="/" component={Editor} />
                    <Route path="/files" component={Files} />
                    <Route path="/help" component={Help} />
                </div>
            </Router>);
    }
}

export default RootPage;
