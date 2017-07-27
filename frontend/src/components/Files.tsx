import * as React from 'react';

import { Grid , Table, Button, Glyphicon } from 'react-bootstrap';
import { File, Database, API } from '../API';
import './Files.css';
import { Link } from 'react-router-dom';

const EXAMPLES_LOADING = 0;
const EXAMPLES_LOADED = 1;
const EXAMPLES_FAILED = 2;

interface State {
    files: File[];
    examples: string[];
    examplesStatus: number;
}

class Files extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = {
            files: [],
            examples: [],
            examplesStatus: EXAMPLES_LOADING
        };
    }

    componentDidMount() {
        this.refreshFiles();
    }

    render() {
        let handlerFor = (fileName: string) => {
            return (evt: any) => {
                Database.getInstance().then((db: Database) => {
                    return db.deleteFile(fileName);
                }).then((ok: boolean) => {
                    if (ok) {
                        this.refreshFiles();
                    }
                });
            };
        };
        let filesView = this.state.files.map((file) => {
            return (
                <tr key={file.name}>
                    <td>
                        <Link to={'/file/' + file.name}>{file.name}</Link>
                    </td>
                    <td>Lokal</td>
                    <td>
                        <Button bsStyle="danger" onClick={handlerFor(file.name)} ><Glyphicon glyph={'trash'} /></Button>
                    </td>
                </tr>
            );
        });
        let examplesView: any;
        if (this.state.examplesStatus === EXAMPLES_LOADED) {
            let examples = this.state.examples.map((example) => {
                return (
                    <tr key={example}>
                        <td>
                            <Link to={'/examplefile/' + example}>{example}</Link>
                        </td>
                    </tr>
                );
            });

            examplesView = (
                <Table>
                    <thead>
                        <tr>
                            <th>Name</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examples}
                    </tbody>
                </Table>
            );
        } else if (this.state.examplesStatus === EXAMPLES_FAILED) {
            examplesView = (
                <p>Beispieldateien konnten nicht geladen werden</p>
            );
        } else {
            examplesView = (
                <p>Beispieldateien werden geladen...</p>
            );
        }

        return (
            <Grid>
                <Table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Typ</th>
                            <th>Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filesView}
                    </tbody>
                </Table>
                <h4>Beispieldateien</h4>
                {examplesView}
            </Grid>
        );
    }

    private refreshFiles() {
        Database.getInstance().then((db: Database) => {
            return db.getFiles();
        }).then((data: File[]) => {
            this.setState({files: data});
            return API.getCodeExamplesList();
        }).then((list: string[]) => {
            this.setState({examples: list, examplesStatus: EXAMPLES_LOADED});
        }).catch((e) => {
            this.setState({examplesStatus: EXAMPLES_FAILED});
        });
    }
}

export default Files;
