import * as React from 'react';

import { Grid , Table, Button, Glyphicon } from 'react-bootstrap';
import { File, Database } from '../API';
import './Files.css';
import { Link } from 'react-router-dom';

interface State {
    files: File[];
}

class Files extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { files: [] };
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
            </Grid>
        );
    }

    private refreshFiles() {
        Database.getInstance().then((db: Database) => {
            return db.getFiles();
        }).then((data: File[]) => {
            this.setState({files: data});
        });
    }
}

export default Files;
