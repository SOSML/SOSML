import * as React from 'react';

import { Grid , Table, Button, Glyphicon } from 'react-bootstrap';
import { File, Database } from '../API';
import './Files.css';

interface State {
    files: File[];
}

class Files extends React.Component<any, State> {
    constructor(props: any) {
        super(props);

        this.state = { files: [] };
    }

    componentDidMount() {
        Database.getInstance().then((db: Database) => {
            return db.getFiles();
        }).then((data: File[]) => {
            this.setState({files: data});
        });
    }

    render() {
        let filesView = this.state.files.map((file) => {
            return (
                <tr key={file.name}>
                    <td>{file.name}</td>
                    <td>Lokal</td>
                    <td>
                        <Button bsStyle="danger"><Glyphicon glyph={'trash'} /></Button>
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

}

export default Files;
