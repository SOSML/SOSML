import * as React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
const LinkContainer = require('react-router-bootstrap').LinkContainer;
// ^ this circumvents type checking as the @types/react-router-bootstrap package is buggy
// it does not know the exact property, although it is clearly specified
// in the documentation!

// import './MainMenu.css';

class MenuBar extends React.Component<any, any> {
    render() {
        return (
            <Navbar inverse={true} collapseOnSelect={true} staticTop={true} fluid={true}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <img src="/logo.png" style={{padding: '10px'}} alt="Logo" />
                    </Navbar.Brand>
                    <Navbar.Brand>
                        <a href="#">SOSML</a>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <LinkContainer exact={true} to="/">
                            <NavItem>Editor</NavItem>
                        </LinkContainer>
                    </Nav>
                    <Nav pullRight={true}>
                        <LinkContainer to="/help">
                            <NavItem>Hilfe</NavItem>
                        </LinkContainer>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>);
    }
}

export default MenuBar;
