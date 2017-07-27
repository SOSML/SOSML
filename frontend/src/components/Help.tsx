import * as React from 'react';
import { Alert } from 'react-bootstrap';

class Help extends React.Component<any, any> {
    render() {
        return (
            <div className="container">
                <h2>Hilfe</h2>
                <hr />
                <h3>Editor &amp; Ausführen Grundlagen</h3>
                <p>
                    In der Editor Ansicht können Sie SML Code links in den Texteditor eintippen. <br />
                    Es gibt zwei Modi, die bestimmen wie der Code ausgeführt wird:
                </p>
                    <ol>
                        <li>Der Code wird in Ihren Browser ausgeführt.</li>
                        <li>Der Code wird auf dem Server ausgeführt.</li>
                    </ol>
                <p>
                    Sie können erkennen in welchen Modus sie sich befinden rechts im
                    Titel der Ausgabe Anzeige. Hier können sie falls benötigt auch zwischen
                    den Modi wechseln.
                </p>
                <h4>Browser Modus</h4>
                <p>
                    Im Browser Modus wird der eingetippte SML Code
                    automatisch ausgeführt, sobald sie eine Anweisung mit einem <code>;</code> abschliessen.
                    Ist die Ausführung erfolgreich, so wird der Code grün markiert.
                    Ist der Code ungültig oder beinhaltet der Code eine nicht behandelte SML
                    Ausnahme, so wird dieser Rot markiert.
                    In allen Fällen können sie die Ausgabe Ihres Programms oder die Fehlermeldung
                    in der rechten Ausgabe Anzeige sehen.
                </p>
                <Alert bsStyle="info"><strong>Beachten Sie:</strong> Sollten Sie Code schreiben,
                dessen Ausführung lange braucht oder der nicht terminiert, so
                wirkt sich dies auf die Performance ihres Browsers aus.</Alert>
                <h4>Server Modus</h4>
                <p>
                    Im Server Modus wird der Code erst ausgeführt, wenn Sie dies mit dem
                    "Ausführen" Knopf explizit anfordern. Hierbei wird der Code an den Server
                    geschickt und dort mit MoscowML ausgeführt. Sie bekommen die Ausgabe
                    des Interpreters in der Ausgabe Anzeige angezeigt. Sollte ihr Code zu
                    lange laufen, so wird dieser nach einer Weile terminiert.<br />
                    In diesem Modus entfällt auch die Markierung des Codes.
                </p>
                <hr />
                <h3>Code teilen</h3>
                <p>
                    Sie können in der Editor Ansicht Code mit Mitstudenten teilen.
                    Nutzen Sie dafür den "Teilen" Knopf. Sollte das Teilen erfolgreich
                    gewesen sein, so bekommen sie nun einen Link angezeigt den sie
                    weiterreichen können. Dieser Link speichert den exakt den Code
                    wie er sicht zur Zeit des Teilens in dem Editor befand.
                    Sollten Sie doch noch eine Änderung vornehmen wollen, so teilen
                    sie den Code erneuert.
                </p>
                <hr />
                <h3>Code speichern &amp; Dateiansicht</h3>
                <p>
                    Sie können Code, den Sie geschrieben haben, lokal in Ihren Browser
                    speichern. Geben Sie dazu einen Dateinamen in das entsprechende
                    Textfeld in der Editor Ansicht ein und klicken sie auf "Speichern".
                    Der Code wird nicht automatisch gespeichert, betätigen Sie also
                    "Speichern" jedes mal, wenn sie speichern wollen. <br />
                    Eine Liste der lokal gespeicherten Dateien finden Sie in der
                    Dateiansicht. Hier können sie durch einen Klick auf den Dateinamen
                    eine Datei wieder öffnen und auch Dateien löschen.
                </p>
                <Alert bsStyle="info"><strong>Beachten Sie:</strong> Da die Dateien
                in Ihren Browser gespeichert werden, verlieren Sie diese womöglich wenn
                Sie Browserdaten löschen.</Alert>
            </div>
        );
    }
}

export default Help;
