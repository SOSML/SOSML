import * as React from 'react';
// import './MiniWindow.css';
import MenuBar from './MenuBar';
import Playground from './Playground';
import Help from './Help';
import {
    BrowserRouter as Router,
    Route
} from 'react-router-dom';
import './RootPage.css';

class RootPage extends React.Component<any, any> {
    render() {
        return (
            <Router>
                <div className="rootPage">
                    <MenuBar />
                    <Route exact={true} path="/" component={Playground} />
                    <Route path="/help" component={Help} />
                </div>
            </Router>);
    }
}

export default RootPage;
