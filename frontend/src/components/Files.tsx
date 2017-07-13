import * as React from 'react';

import { Grid , Table} from 'react-bootstrap';
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
        Database.getInstance().getFiles().then((data: File[]) => {
            this.setState({files: data});
        });
    }

    render() {
        let filesView = this.state.files.map((file) => {
            return (
                <tr key={file.name}>
                    <td>{file.name}</td>
                    <td>Lokal</td>
                </tr>
            );
        });

        return (
            <Grid>
                <Table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Speicherort</th>
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
